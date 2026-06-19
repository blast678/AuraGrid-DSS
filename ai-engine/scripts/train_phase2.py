import pandas as pd
import lightgbm as lgb
from sklearn.model_selection import train_test_split
import os
import random
import warnings
warnings.filterwarnings('ignore')

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, 'data')
MODEL_DIR = os.path.join(BASE_DIR, 'models')

def train_lightgbm():
    print("🚀 [Phase 2] Booting LightGBM Training Pipeline...")
    
    # ---------------------------------------------------------
    # STEP 1: The RAM-Safe Data Loader (Stream Sampling)
    # ---------------------------------------------------------
    print("📥 Loading and subsampling 26.7M rows (Keeping ~2%)...")
    data_path = os.path.join(DATA_DIR, 'lgbm_feature_matrix.csv')
    
    # Keep row 0 (headers), then randomly keep 2% of the data to avoid OOM crash
    skip_logic = lambda i: i > 0 and random.random() > 0.02 
    
    df = pd.read_csv(data_path, skiprows=skip_logic)
    print(f"✅ Successfully loaded {len(df)} randomized rows into RAM!")

    # ---------------------------------------------------------
    # STEP 2: Prepare Features (X) and Target (y)
    # ---------------------------------------------------------
    print("⚙️ Formatting data for Decision Trees...")
    
    # Convert zone_id to a categorical type so LightGBM understands it's a label, not a math number
    df['zone_id'] = df['zone_id'].astype('category')
    
    # Define our inputs (X) and our answer key (y)
    features = ['zone_id', 'hour', 'minute', 'day_of_week', 'is_weekend', 
                'lag_15m', 'lag_1h', 'lag_24h', 'rolling_mean_2h']
    
    X = df[features]
    y = df['load_kwh']

    # Split into 80% Training Data and 20% Testing Data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Convert to highly optimized LightGBM Datasets
    train_data = lgb.Dataset(X_train, label=y_train)
    test_data = lgb.Dataset(X_test, label=y_test, reference=train_data)

    # ---------------------------------------------------------
    # STEP 3: Train the Model
    # ---------------------------------------------------------
    print("🌲 Training the Gradient Boosted Trees...")
    params = {
        'objective': 'regression',    # We are predicting a continuous number (kWh)
        'metric': 'rmse',             # Root Mean Squared Error (Lower is better)
        'learning_rate': 0.05,        # How fast it learns
        'num_leaves': 63,             # Complexity of the trees
        'verbose': -1                 # Silence warnings
    }

    # Train for 200 rounds, stopping early if it stops improving
    model = lgb.train(
        params,
        train_data,
        valid_sets=[test_data],
        num_boost_round=200,
        callbacks=[lgb.early_stopping(stopping_rounds=20)]
    )

    # ---------------------------------------------------------
    # STEP 4: Save the Weights
    # ---------------------------------------------------------
    os.makedirs(MODEL_DIR, exist_ok=True)
    model_path = os.path.join(MODEL_DIR, 'global_lgbm_model.txt')
    model.save_model(model_path)
    print(f"✅ SUCCESS! AI Brain saved securely to: {model_path}")

if __name__ == "__main__":
    train_lightgbm()