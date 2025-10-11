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
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from threading import Lock

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


products_df = None

class BulkOrderRequest(BaseModel):
    orderMessage: str
    customerEmail: str
    customerPhone: str

class ConfirmOrderRequest(BaseModel):
    customerEmail: str
    customerPhone: str
    parsedOrder:  List[Dict[str, Any]]



def load_products():
    global products_df
    try:
        products_df = pd.read_json("inventory.json")
        print(f"Loaded {len(products_df)} products from inventory.json")
        return True
    except FileNotFoundError:
        print("inventory.json not found!")
        products_df = pd.DataFrame()  # empty fallback
        return False
    except Exception as e:
        print(f"Error loading products: {str(e)}")
        products_df = pd.DataFrame()
        return False

load_products() 

QUANTITY_MAPPING = {
    'एक': 1, 'दो': 2, 'तीन': 3, 'चार': 4, 'पांच': 5, 'पाँच': 5,
    'छह': 6, 'छः': 6, 'सात': 7, 'आठ': 8, 'नौ': 9, 'दस': 10,
    'ek': 1, 'do': 2, 'teen': 3, 'char': 4, 'paanch': 5, 'panch': 5,
    'chah': 6, 'chhah': 6, 'saat': 7, 'aath': 8, 'nau': 9, 'das': 10,
    'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
    'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10
}


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


def parse_bulk_order_with_gemini(user_input: str) -> List[Dict[str, Any]]:
    """Parse bulk order using Google Gemini"""
    global products_df
    if products_df is None or products_df.empty:
        return []

    products_info = products_df.to_dict('records')
    
    prompt = f"""
You are an expert order parser for a multi-brand snack store. Parse this BULK ORDER where customers can order multiple different products in one sentence.

Customer said: "{user_input}"

AVAILABLE PRODUCTS:
{json.dumps(products_info, indent=2, ensure_ascii=False)}

# Follow the rules for colors, brand names, quantities
Return ONLY a JSON array with this exact structure:
[
    {{
        "color": "Red/Blue/Green/Yellow",
        "quantity": number,
        "product_id": "LAY001/LAY002/LAY003/LAY007/JEL009",
        "English_Name": "lays India's Magic Masala/American Style Cream & Onion/Spanish Tomato Tango/Classic Salted Chips/Juzt Jelly, Strawberry Pouch",
        "Hindi_Name":"इंडियाज मैजिक मसाला/अमेरिकन क्रीम एंड अनियन/स्पैनिश टमाटर टैंगो/क्लासिक सॉल्टेड चिप्स/जस्ट जेली, स्ट्रॉबेरी पाउच",
        "Pack_Size": "50g/140g",
        "price":"20 or 15 or 225",
        "confidence": "high/medium/low"
    }}
]
"""
    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )
        content = response.text.strip()
        content = re.sub(r'```json\s*', '', content)
        content = re.sub(r'```\s*', '', content)
        return json.loads(content)
    except Exception as e:
        print(f" Gemini parsing error: {str(e)}")
        return [] 

def send_email(receiver_email, subject, body):
    sender_email = "adityaaryan531@gmail.com" 
    sender_password = os.getenv("APP_PASSWORD")  
    print(sender_password)
    
    msg = MIMEMultipart()
    msg["From"] = sender_email
    msg["To"] = receiver_email
    msg["Subject"] = subject
    
    msg.attach(MIMEText(body, "html"))
    
    try:
        with smtplib.SMTP("smtp.gmail.com", 587) as server:
            server.starttls()
            server.login(sender_email, sender_password)
            server.send_message(msg)
        print("Email sent successfully to", receiver_email)
    except Exception as e:
        print("Error sending email:", e)

@app.get("/get-inventory")
def get_inventory():
    global products_df
    if products_df is None or products_df.empty:
        load_products()
    return products_df.to_dict(orient="records")

@app.post("/bulk-order")
def bulkOrder(order:BulkOrderRequest):
    print(order.customerPhone)
    response=parse_bulk_order_with_gemini(order.orderMessage)
    print(response)
    return {"parsedOrder": response}


@app.post("/confirm-order")
def confirmOrder(confirmOrder: ConfirmOrderRequest):
    print(confirmOrder.parsedOrder)

    # 🧾 Build HTML email content
    order_details = f"""
    <div style="font-family: Arial, sans-serif; padding: 16px; color: #333;">
      <h2 style="color: #0d0d0d;">Order Confirmation </h2>
      
      <p>Hi there,</p>
      <p>Thank you for placing your order with us! We're processing it and will contact you shortly for confirmation.</p>
      
      <h3>🛍️ Order Details</h3>
      <table style="border-collapse: collapse; width: 100%; margin-top: 10px;">
        <tr style="background-color: #f2f2f2;">
          <th style="border: 1px solid #ddd; padding: 8px;">Product</th>
          <th style="border: 1px solid #ddd; padding: 8px;">Pack Size</th>
          <th style="border: 1px solid #ddd; padding: 8px;">Quantity</th>
          <th style="border: 1px solid #ddd; padding: 8px;">Price</th>
        </tr>
    """

    total_price = 0
    for item in confirmOrder.parsedOrder:
        # 🧠 Ensure price and quantity are numeric
        price = float(item.get("price", 0))
        quantity = int(item.get("quantity", 0))

        item_total = price * quantity
        total_price += item_total

        order_details += f"""
        <tr>
          <td style="border: 1px solid #ddd; padding: 8px;">{item['English_Name']}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">{item['Pack_Size']}</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">{quantity}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">₹{item_total}</td>
        </tr>
        """

    order_details += f"""
      </table>
      
      <h3 style="margin-top: 15px;">💰 Total Amount: ₹{total_price}</h3>
      
      <p style="margin-top: 20px;">
        Our team will contact you soon on your registered number 
        <strong>+91 {confirmOrder.customerPhone}</strong> for order confirmation and delivery details.
      </p>

      <p>For any queries, feel free to reply to this email.</p>
      
      <p style="margin-top: 20px;">Warm regards,<br><b>The SnackStore Team 🍪</b></p>
    </div>
    """

    # Send confirmation email
    send_email(
        receiver_email=confirmOrder.customerEmail,
        subject="🧾 Your Order Confirmation - SnackStore",
        body=order_details
    )

    # Save or update order in JSON
    orders_file = "orders.json"

    if os.path.exists(orders_file):
        with open(orders_file, "r") as f:
            existing_orders = json.load(f)
    else:
        existing_orders = []

    # Merge if same product already exists
    for new_item in confirmOrder.parsedOrder:
        matched = False
        for existing_order in existing_orders:
            if (
                existing_order["English_Name"] == new_item["English_Name"]
                and existing_order["Pack_Size"] == new_item["Pack_Size"]
            ):
                existing_order["Quantity"] += int(new_item["quantity"])
                matched = True
                break
        
        if not matched:
            clean_item = {
                "Product_ID": new_item.get("product_id") or new_item.get("Product_ID", ""),
                "English_Name": new_item["English_Name"],
                "Color": new_item.get("color", ""),
                "Pack_Size": new_item["Pack_Size"],
                "Price": float(new_item.get("price", 0)),
                "Quantity": int(new_item.get("quantity", 0)),
                "Description": new_item.get("Description", "")
            }
            existing_orders.append(clean_item)

    with open(orders_file, "w") as f:
        json.dump(existing_orders, f, indent=2)

    return {
        "message": "Order confirmed, email sent, and data saved successfully!",
        "total_price": total_price
    }



@app.get("/pending-order")
def getPending():
    orders_file = "orders.json"

    if not os.path.exists(orders_file):
        return {"orders": []}  # No orders yet

    df = pd.read_json(orders_file)
    orders_list = df.to_dict(orient="records")  # Convert DataFrame to list of dicts

    return {"orders": orders_list}


@app.post("/contract-analyzer-summarization")
def contractSummarizer(pdf: UploadFile):
    return {"summary": "File received successfully"}



