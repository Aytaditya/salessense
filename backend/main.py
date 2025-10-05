from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine
import pandas as pd
import numpy as np
import re
import io
import json
from google import genai
from dotenv import load_dotenv
import os

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")


client = genai.Client(api_key=api_key)
app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def query_llm_for_sql(message: str, columns: list, sample_data: dict):
    """
    Sends a prompt to Gemini with column info AND sample data
    to generate better SQL queries for complex questions.
    """
    prompt = f"""
You are an expert SQL data analyst specializing in SQLite.

DATABASE SCHEMA:
- Table name: 'data'
- Columns: {columns}

SAMPLE DATA (first 3 rows):
{json.dumps(sample_data, indent=2)}

USER QUESTION: "{message}"

INSTRUCTIONS:
1. Analyze the question carefully and identify what data operations are needed (aggregations, joins, filters, grouping, subqueries, etc.)
2. Write a SINGLE, CORRECT SQLite query that answers the question completely
3. For complex questions:
   - Use GROUP BY for aggregations per category
   - Use HAVING for filtering grouped results
   - Use subqueries or CTEs when needed (e.g., finding items that meet certain conditions)
   - Use COUNT(DISTINCT ...) to count unique values
   - Use proper JOINs if relationships exist in the data
4. Provide a brief one-sentence interpretation of what you're calculating

IMPORTANT SQL RULES:
- Column names may contain underscores (they've been sanitized)
- Use proper aggregation functions: COUNT, SUM, AVG, MIN, MAX
- For "only in one" type questions, use GROUP BY with HAVING COUNT(DISTINCT ...) = 1
- For average calculations, use AVG() function
- Order results meaningfully (usually DESC for top results, ASC for bottom)
- Limit results to reasonable numbers (e.g., TOP 10) unless asked otherwise

OUTPUT FORMAT:
First line: Brief interpretation in plain text
Then: ```sql
YOUR SQL QUERY HERE
```

EXAMPLES:
Question: "Which products are only sold in one country?"
Interpretation: Finding products that appear in only one unique country.
```sql
SELECT product_name, COUNT(DISTINCT country) as country_count
FROM data
GROUP BY product_name
HAVING COUNT(DISTINCT country) = 1
```

Question: "What is the average order value per country?"
Interpretation: Calculating the mean order value grouped by country.
```sql
SELECT country, AVG(order_value) as avg_order_value
FROM data
GROUP BY country
ORDER BY avg_order_value DESC
```

NOW ANSWER THE USER'S QUESTION:
"""

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt
    )
    return response.text.strip()



def summarize_result_with_llm(question: str, data: str, interpretation: str):
    """
    Sends the SQL query result to Gemini to get a natural language summary.
    """
    prompt = f"""
You are a helpful data analyst who explains results in plain English.

USER'S ORIGINAL QUESTION: "{question}"

WHAT WAS CALCULATED: {interpretation}

QUERY RESULTS:
{data}

TASK:
Provide a clear, concise summary that directly answers the user's question.
- Explain what the data shows in simple terms
- Highlight key findings or patterns
- If there are multiple results, summarize the top findings
- Use numbers and specifics from the data
- Be conversational and friendly

Example responses:
- "Based on the data, 5 products are only sold in one country: Product A in USA, Product B in Canada..."
- "The average order value varies by country. Germany has the highest at $450, followed by USA at $380..."
"""
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt
    )
    return response.text.strip()

@app.post("/api/chat")
async def chat(message: str = Form(...), file: UploadFile = File(...)):
    """
    This endpoint accepts a CSV/Excel file and a natural language message,
    converts the message to a SQL query, executes it, and returns the result.
    """
    try:
        # Read uploaded file
        print(f"Received file: {file.filename}")
        content = await file.read()
        buffer = io.BytesIO(content)

        # Load CSV or Excel
        if file.filename.endswith(".csv"):
            df = pd.read_csv(buffer)
        else:
            df = pd.read_excel(buffer)

        #  Fix NaN/inf values
        df.replace([np.nan, np.inf, -np.inf], None, inplace=True)

        #  Auto-detect and normalize any Date column
        for col in df.columns:
            if "date" in col.lower():
                df[col] = pd.to_datetime(df[col], errors="coerce", dayfirst=True)
                df[col] = df[col].dt.strftime("%Y-%m-%d")

        # --- SQL Database Integration ---
        original_columns = df.columns.tolist()
        sanitized_columns = [re.sub(r'[^a-zA-Z0-9_]', '_', col) for col in original_columns]
        df.columns = sanitized_columns

        #  Get sample data for better context
        sample_data = df.head(3).to_dict(orient="records")

        engine = create_engine('sqlite:///:memory:')
        df.to_sql('data', engine, index=False, if_exists='replace')

        # Ask Gemini for SQL + interpretation with enhanced context
        raw_response = query_llm_for_sql(message, sanitized_columns, sample_data)

        # Extract interpretation & SQL
        interpretation = "Could not interpret the model's response."
        sql_code = ""

        if "```sql" in raw_response:
            parts = raw_response.split("```sql")
            interpretation = parts[0].strip()
            sql_code = parts[1].split("```")[0].strip()
        else:
            parts = raw_response.split("```")
            if len(parts) > 1:
                interpretation = parts[0].strip()
                sql_code = parts[1].strip()

        if not sql_code:
            raise ValueError("The AI model did not return a valid SQL query.")

        # Execute query
        result_df = pd.read_sql_query(sql_code, engine)

        # Convert result to JSON
        answer = result_df.to_dict(orient="records")

        # Summarize with enhanced context
        natural_language_summary = "No data was returned from the query to summarize."
        if answer:
            data_string = json.dumps(answer, indent=2)
            natural_language_summary = summarize_result_with_llm(
                message, data_string, interpretation
            )

        return {
            "interpretation": interpretation,
            "code_executed": sql_code,
            "answer": answer,
            "natural_language_summary": natural_language_summary
        }

    except Exception as e:
        return {
            "columns": [],
            "interpretation": "An error occurred.",
            "code_executed": sql_code if 'sql_code' in locals() else "",
            "error": str(e)
        }