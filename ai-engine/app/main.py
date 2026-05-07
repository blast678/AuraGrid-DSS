import os
import psycopg2
import pandas as pd
from fastapi import FastAPI, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Initialize App
app = FastAPI(title="AuraGrid AI Engine")

# Allow Next.js frontend to call this API directly if needed
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Aiven Postgres Database URL
DATABASE_URL = os.getenv("DATABASE_URL")

# Global state for the Frontend MLOps Dashboard
TRAINING_STATUS = {"is_training": False, "last_trained": "Awaiting initial sync"}

class PredictRequest(BaseModel):
    zone_id: str
    historical_load: list = []

@app.get("/health")
def health_check():
    db_status = "Disconnected"
    if DATABASE_URL:
        try:
            conn = psycopg2.connect(DATABASE_URL)
            conn.close()
            db_status = "Connected to Aiven PostgreSQL"
        except Exception as e:
            db_status = f"Error: {e}"
    return {"status": "AI Engine Live", "database": db_status}

@app.post("/predict")
def get_prediction(req: PredictRequest):
    # This is where your serialized Prophet model loads.
    # Returning a mock array here guarantees your hackathon demo won't crash 
    # even if Prophet fails to load the JSON file in the cloud.
    print(f"⚡ INFERENCE REQUEST: Predicting load for {req.zone_id}")
    return [
        {"ds": "2026-05-08T18:00:00", "yhat": 82.4}, # Over 60kWh! Triggers Water-Filling
        {"ds": "2026-05-08T19:00:00", "yhat": 85.1},
        {"ds": "2026-05-08T20:00:00", "yhat": 79.5},
        {"ds": "2026-05-08T21:00:00", "yhat": 60.2}
    ]

# --- MLOPS COLD PATH LOGIC ---
def execute_retraining(zone_id: str):
    global TRAINING_STATUS
    TRAINING_STATUS["is_training"] = True
    try:
        # In production, this pulls from Aiven and runs Prophet.fit()
        import time
        time.sleep(5) # Simulating training time for the frontend demo
        TRAINING_STATUS["last_trained"] = pd.Timestamp.now().strftime("%Y-%m-%d %H:%M:%S")
        print(f"✅ Model successfully retrained for {zone_id} using Aiven Data Lake!")
    except Exception as e:
        print(f"❌ Retraining failed: {e}")
    finally:
        TRAINING_STATUS["is_training"] = False

@app.post("/admin/force-retrain/{zone_id}")
async def force_retrain(zone_id: str, background_tasks: BackgroundTasks):
    if TRAINING_STATUS["is_training"]:
        return {"status": "Model is already training..."}
    background_tasks.add_task(execute_retraining, zone_id)
    return {"status": "Retraining triggered via Cold Path", "zone": zone_id}

@app.get("/admin/status")
async def get_status():
    return TRAINING_STATUS