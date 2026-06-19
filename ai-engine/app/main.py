import os
import pandas as pd
import lightgbm as lgb
from datetime import datetime, timedelta
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List

app = FastAPI(title="AuraGrid AI - Enterprise LightGBM Inference")

# Allow Next.js frontend and Go backend to talk to this API
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# ---------------------------------------------------------
# STEP 1: Load the Brain into RAM at Startup
# ---------------------------------------------------------
MODEL_PATH = "models/global_lgbm_model.txt"
model = None

@app.on_event("startup")
def load_model():
    global model
    if os.path.exists(MODEL_PATH):
        # We load the file ONCE when the server boots. Instant inference.
        model = lgb.Booster(model_file=MODEL_PATH)
        print("🧠 ✅ AI Brain loaded into memory successfully!")
    else:
        print("⚠️ WARNING: Brain not found! Run train_phase2.py first.")

# ---------------------------------------------------------
# STEP 2: Define the Go Backend Request Contract
# ---------------------------------------------------------
class PredictRequest(BaseModel):
    zone_id: str
    # The Go API MUST send us the last 24 hours of grid load (96 blocks)
    # so we can calculate the lag features!
    recent_history_kwh: List[float] 
    horizon_blocks: int = 96 # We predict 24 hours into the future

# ---------------------------------------------------------
# STEP 3: The Hot Path (Real-Time Inference Endpoint)
# ---------------------------------------------------------
@app.post("/predict")
def get_prediction(req: PredictRequest):
    global model
    if model is None:
        raise HTTPException(status_code=503, detail="AI Model not loaded.")
        
    if len(req.recent_history_kwh) < 96:
        raise HTTPException(status_code=400, detail="Need exactly 96 historical blocks (24 hrs) for lag features.")

    # We copy the history because we are going to modify it
    history = req.recent_history_kwh.copy()
    
    # Snap the current time to the nearest 15-minute block
    current_time = datetime.now().replace(second=0, microsecond=0)
    current_time -= timedelta(minutes=current_time.minute % 15)

    predictions = []

    # 🔄 THE AUTOREGRESSIVE LOOP
    for i in range(req.horizon_blocks):
        future_time = current_time + timedelta(minutes=15 * (i + 1))
        
        # Dynamically calculate features from the end of the history array
        lag_15m = history[-1]
        lag_1h = history[-4]
        lag_24h = history[-96]
        rolling_mean_2h = sum(history[-8:]) / 8.0

        # Build the exact Feature Matrix we used during Training (Phase 1)
        df_features = pd.DataFrame([{
            'zone_id': req.zone_id,
            'hour': future_time.hour,
            'minute': future_time.minute,
            'day_of_week': future_time.weekday(),
            'is_weekend': 1 if future_time.weekday() >= 5 else 0,
            'lag_15m': lag_15m,
            'lag_1h': lag_1h,
            'lag_24h': lag_24h,
            'rolling_mean_2h': rolling_mean_2h
        }])

        # Tell LightGBM that zone_id is a label, not a math number
        df_features['zone_id'] = df_features['zone_id'].astype('category')

        # Predict the next 15-min block!
        pred_kwh = float(model.predict(df_features)[0])
        
        # ⚠️ CRITICAL STEP: Append the prediction to the history array!
        history.append(pred_kwh)
        
        # Save for the Go API response
        predictions.append({
            "timestamp": future_time.strftime('%Y-%m-%dT%H:%M:%S'),
            "predicted_load_kwh": round(pred_kwh, 2)
        })

    print(f"⚡ PREDICTION: Successfully forecasted 24 hrs for {req.zone_id}")
    return predictions