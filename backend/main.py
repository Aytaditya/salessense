from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine
import pandas as pd
import numpy as np
import subprocess
import re
import io
import json

app = FastAPI()

# Enable CORS for all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 🔹 Function to query the LLM for a SQL query
def query_llm_for_sql(message: str, columns: list):
    """
    Sends a prompt to the Ollama LLM to get a natural language interpretation
    and a corresponding SQLite query.
    """
    # The prompt is updated to request SQLite syntax against a table named 'data'
    prompt = f"""
You are a professional SQL data analyst specializing in SQLite.
The database has a single table named 'data' with the following columns: {columns}

User question: "{message}"

Your task is to:
1. Provide a brief, one-sentence interpretation of what the user is asking.
2. Write a single, correct SQLite query to answer the user's question.

- The final output of your query should be the answer to the user's question.
- Do not include any explanations or comments in the SQL code block.
- Wrap the interpretation in plain text and the SQLite query in a ```sql code block.
"""
    # Call the Ollama LLM with the specified model
    result = subprocess.run(
        ["ollama", "run", "llama3.2"],
        input=prompt,
        capture_output=True,
        text=True  # Decode output as text
    )
    return result.stdout

# 🔹 Function to summarize the result in natural language
def summarize_result_with_llm(question: str, data: str):
    """
    Sends the SQL query result to the LLM to get a natural language summary.
    """
    prompt = f"""
You are a helpful data analyst who explains results in plain English.

The user originally asked: "{question}"

The data result is:
{data}

Based on this data, provide a concise, natural language summary that directly answers the user's question.
- Do not just repeat the data. Explain what it means.
- Be friendly and conversational.
- If the data is a single number or fact, state it clearly. For example, if the result is 50, you could say "The total number is 50."
- If the data is a list, summarize the key findings. For example, "The top 3 countries by sales are..."
"""
    # Call the Ollama LLM with the specified model
    result = subprocess.run(
        ["ollama", "run", "llama3.2"],
        input=prompt,
        capture_output=True,
        text=True
    )
    return result.stdout.strip()


@app.post("/api/chat")
async def chat(message: str = Form(...), file: UploadFile = File(...)):
    """
    This endpoint accepts a CSV/Excel file and a natural language message,
    converts the message to a SQL query, executes it, and returns the result.
    """
    try:
        # Read the uploaded file's content into an in-memory buffer
        print(f"Received file: {file.filename}")
        content = await file.read()
        buffer = io.BytesIO(content)

        # Load CSV or Excel data into a pandas DataFrame
        if file.filename.endswith(".csv"):
            df = pd.read_csv(buffer)
        else:
            df = pd.read_excel(buffer)

        # Cleanse data by replacing non-serializable values
        df.replace([np.nan, np.inf, -np.inf], None, inplace=True)

        # --- SQL Database Integration ---
        # 1. Sanitize column names to be SQL-friendly
        original_columns = df.columns.tolist()
        sanitized_columns = [re.sub(r'[^a-zA-Z0-9_]', '_', col) for col in original_columns]
        df.columns = sanitized_columns
        
        # 2. Create an in-memory SQLite database and load the DataFrame into it
        engine = create_engine('sqlite:///:memory:')
        df.to_sql('data', engine, index=False, if_exists='replace')
        # ---

        # Ask LLM for interpretation and a SQL query
        raw_response = query_llm_for_sql(message, sanitized_columns)

        # Extract interpretation and SQL code from the LLM response
        interpretation = "Could not interpret the model's response."
        sql_code = ""

        if "```sql" in raw_response:
            parts = raw_response.split("```sql")
            interpretation = parts[0].strip()
            sql_code = parts[1].split("```")[0].strip()
        else: # Fallback if the language is not specified
            parts = raw_response.split("```")
            if len(parts) > 1:
                interpretation = parts[0].strip()
                sql_code = parts[1].strip()

        if not sql_code:
            raise ValueError("The AI model did not return a valid SQL query.")

        # Execute the generated SQL query safely using pandas
        result_df = pd.read_sql_query(sql_code, engine)
        
        # Convert result into a JSON-serializable format
        answer = result_df.to_dict(orient="records")

        # --- NEW: Summarize the answer in natural language ---
        data_string = json.dumps(answer, indent=2)
        natural_language_summary = "No data was returned from the query to summarize."
        if answer: # Only ask for a summary if there's data
            natural_language_summary = summarize_result_with_llm(message, data_string)
        # ---

        return {
            "interpretation": interpretation,
            "code_executed": sql_code,
            "answer": answer,
            "natural_language_summary": natural_language_summary
        }

    except Exception as e:
        # Return a structured error response
        return {
            "columns": [],
            "interpretation": "An error occurred.",
            "code_executed": sql_code if 'sql_code' in locals() else "",
            "error": str(e)
        }