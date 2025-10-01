from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import numpy as np
import io
from pydantic import BaseModel


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    message: str



@app.get("/")
async def root():
    return {"message": "Hello World"}

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # change "*" to ["http://localhost:3000"] for security
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/csv-list")
async def csv_list(file: UploadFile = File(...)):
    if not file:
        return {"error": "No file uploaded"}
    # Load file
    try:
        if file.filename.endswith(".csv"):
            df = pd.read_csv(file.file)
        else:  # Excel
            df = pd.read_excel(file.file)
    except Exception as e:
        return {"error": f"Failed to read file: {str(e)}"}

    # Replace NaN, inf, -inf with None
    df.replace([np.nan, np.inf, -np.inf], None, inplace=True)
    # Convert to list of dicts
    data = df.to_dict(orient="records")

    return {"data": data}


@app.post("/api/chat")
async def chat_endpoint(request: ChatRequest):
    # Dummy response for demonstration
    return {"answer": request.message}


