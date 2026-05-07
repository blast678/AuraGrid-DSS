import os
import sys
import logging
from pathlib import Path
from contextlib import asynccontextmanager
import pandas as pd
from fastapi import FastAPI
import prophet
import os
import psycopg2

# 1. SILENCE THE PLOTLY DRAMA
# This stops the "Interactive plots will not work" warning from cluttering your logs
logging.getLogger('prophet').setLevel(logging.ERROR)

# pyrefly: ignore [missing-import]
from prophet.serialize import model_from_json
m = None
DATABASE_URL = os.getenv("DATABASE_URL")
@asynccontextmanager
async def lifespan(app: FastAPI):
    global m
    # Define paths relative to this file
    BASE_DIR = Path(__file__).resolve().parent.parent
    MODEL_PATH = BASE_DIR / "models" / "prophet_model.json"
    
    print(f"📦 AuraGrid: Loading Prophet Model from {MODEL_PATH}")
    
    try:
        if MODEL_PATH.exists():
            with open(MODEL_PATH, 'r') as fin:
                # We load the model. model_from_json is the enterprise standard.
                m = model_from_json(fin.read())
            print("✅ SUCCESS: AI Engine is live on Local PC.")
        else:
            print(f"❌ ERROR: Model file missing at {MODEL_PATH}")
    except Exception as e:
        print(f"❌ CRITICAL: Math engine failure. Reason: {e}")
        print("💡 TIP: Ensure your venv has 'prophet' and 'cmdstanpy' installed.")
    
    yield
    print("🔌 AI-Engine: Shutting down.")

# Initialize FastAPI
app = FastAPI(title="AuraGrid AI-Engine", lifespan=lifespan)

@app.get("/health")
def health_check():
    try:
        # Test the connection to Aiven
        conn = psycopg2.connect(DATABASE_URL)
        conn.close()
        return {"status": "AI Engine Live", "database": "Connected"}
    except Exception as e:
        return {"status": "Database Error", "details": str(e)}

@app.post("/predict")
def predict_demand(horizon_hours: int = 168):
    if m is None:
        return {"error": "Prophet engine is offline."}
    
    # Generate the time-series forecast 
    future = m.make_future_dataframe(periods=horizon_hours, freq='H')
    forecast = m.predict(future)
    
    # Ensure no negative electricity values 
    forecast['yhat'] = forecast['yhat'].clip(lower=0)
    
    payload = forecast[['ds', 'yhat']].tail(horizon_hours)
    return payload.to_dict(orient="records")

if __name__ == "__main__":
    import uvicorn
    # Use 127.0.0.1 for local Windows dev to avoid 'Connection Refused' errors
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)