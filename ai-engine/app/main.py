import os
import math
import pandas as pd
import lightgbm as lgb
from datetime import datetime, timedelta
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List

app = FastAPI(title="AuraGrid AI - Enterprise Engine")

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
        model = lgb.Booster(model_file=MODEL_PATH)
        print("🧠 ✅ AI Brain loaded into memory successfully!")
    else:
        print("⚠️ WARNING: Brain not found! Run train_phase2.py first.")

# ---------------------------------------------------------
# STEP 2: PART A - The Go Backend Request Contract
# ---------------------------------------------------------
class PredictRequest(BaseModel):
    zone_id: str
    recent_history_kwh: List[float] 
    horizon_blocks: int = 96

# ---------------------------------------------------------
# STEP 3: PART A - Real-Time Inference Endpoint (Peak Shaving)
# ---------------------------------------------------------
@app.post("/predict")
def get_prediction(req: PredictRequest):
    global model
    if model is None:
        raise HTTPException(status_code=503, detail="AI Model not loaded.")
        
    if len(req.recent_history_kwh) < 96:
        raise HTTPException(status_code=400, detail="Need exactly 96 historical blocks (24 hrs) for lag features.")

    history = req.recent_history_kwh.copy()
    current_time = datetime.now().replace(second=0, microsecond=0)
    current_time -= timedelta(minutes=current_time.minute % 15)

    predictions = []

    for i in range(req.horizon_blocks):
        future_time = current_time + timedelta(minutes=15 * (i + 1))
        
        lag_15m = history[-1]
        lag_1h = history[-4]
        lag_24h = history[-96]
        rolling_mean_2h = sum(history[-8:]) / 8.0

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

        df_features['zone_id'] = df_features['zone_id'].astype('category')
        pred_kwh = float(model.predict(df_features)[0])
        
        history.append(pred_kwh)
        
        predictions.append({
            "timestamp": future_time.strftime('%Y-%m-%dT%H:%M:%S'),
            "predicted_load_kwh": round(pred_kwh, 2)
        })

    return predictions

# ---------------------------------------------------------
# STEP 4: PART B - Infrastructure Location Planning (NEW)
# ---------------------------------------------------------
class ZoneData(BaseModel):
    zone_name: str
    ev_density: int          
    grid_utilization: float  
    existing_chargers: int   

class LocationRequest(BaseModel):
    zones: List[ZoneData]

@app.post("/recommend-locations")
def recommend_locations(req: LocationRequest):
    recommendations = []

    for zone in req.zones:
        # 1. Base Demand: More EVs = Higher Score
        base_score = zone.ev_density * 1.5 
        
        # 2. Grid Penalty: Exponential penalty if the transformer is stressed
        grid_penalty = math.exp(zone.grid_utilization * 5) 
        
        # 3. Infra Penalty: Penalize zones that already have chargers
        infra_penalty = (zone.existing_chargers * 20) + 1
        
        # Synergy Score Math
        final_score = base_score / (grid_penalty * infra_penalty)
        
        recommendations.append({
            "zone": zone.zone_name,
            "synergy_score": round(final_score, 2),
            "ev_density": zone.ev_density,
            "grid_stress_pct": round(zone.grid_utilization * 100, 1),
            "existing_chargers": zone.existing_chargers
        })

    # Sort from highest score to lowest score
    recommendations.sort(key=lambda x: x["synergy_score"], reverse=True)
    return recommendations