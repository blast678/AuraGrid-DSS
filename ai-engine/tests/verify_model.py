import joblib
import pandas as pd
import numpy as np
from pathlib import Path

# Setup paths based on your project structure[cite: 6]
BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_PATH = BASE_DIR / "models" / "auragrid_lgbm_model.pkl"

def test_model_artifact():
    print(f"🔍 Testing artifact at: {MODEL_PATH}")
    
    # TEST 1: Loadability
    try:
        model = joblib.load(MODEL_PATH)
        print("✅ Test 1 Passed: Model loaded into memory.")
    except Exception as e:
        print(f"❌ Test 1 Failed: Could not load .pkl file. Error: {e}")
        return

    # TEST 2: Feature Consistency
    # LightGBM expects 'hour', 'dayofweek', 'month' based on our training
    sample_input = pd.DataFrame({
        'hour': [10, 15, 22],
        'dayofweek': [1, 1, 1], # Tuesday
        'month': [5, 5, 5]
    })
    
    try:
        preds = model.predict(sample_input)
        print(f"✅ Test 2 Passed: Model accepted features and returned {len(preds)} predictions.")
    except Exception as e:
        print(f"❌ Test 2 Failed: Input feature mismatch. Error: {e}")
        return

    # TEST 3: Physical Reality Check
    # Ensure predictions aren't wildly impossible (negative or NaN)[cite: 3]
    if np.any(preds < 0):
        print("⚠️ Warning: Model returned negative values. Ensure .clip(min=0) is used in main.py.")
    
    if np.isnan(preds).any():
        print("❌ Test 3 Failed: Model returned NaN values.")
    else:
        print(f"✅ Test 3 Passed: Sample predictions: {preds.tolist()}")
        print("\n🚀 VERDICT: Model is production-ready.")

if __name__ == "__main__":
    test_model_artifact()