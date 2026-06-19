import pandas as pd
import numpy as np
import json
import os
import warnings
warnings.filterwarnings('ignore')

# Set relative paths securely
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, 'data')

def process_phase1():
    print("🚀 [Phase 1] Booting Data Engineering Pipeline...")

    # ---------------------------------------------------------
    # STEP 1: Flatten JSON into 15-Min Blocks (Time Binning)
    # ---------------------------------------------------------
    acn_path = os.path.join(DATA_DIR, 'acn_sessions.json')
    print("📊 1. Flattening ACN sessions...")
    with open(acn_path, 'r') as f:
        acn_data = json.load(f)
    
    records = []
    for session in acn_data:
        try:
            start = pd.to_datetime(session['connectionTime']).round('15min')
            end = pd.to_datetime(session['disconnectTime']).round('15min')
            if start == end: 
                end = start + pd.Timedelta(minutes=15)
                
            bins = pd.date_range(start, end, freq='15min')[:-1]
            if len(bins) == 0: continue
                
            load_per_bin = session['kWhDelivered'] / len(bins)
            for b in bins:
                records.append({'time': b, 'load_kwh': load_per_bin})
        except Exception:
            continue

    # Group overlapping cars into total grid load per 15 mins
    base_load_df = pd.DataFrame(records).groupby('time')['load_kwh'].sum().reset_index()
    
    # 🛑 THE RAM SAVER: Slice only the last 30 days of data
    max_time = base_load_df['time'].max()
    cutoff_time = max_time - pd.Timedelta(days=30)
    base_load_df = base_load_df[base_load_df['time'] >= cutoff_time].copy()

    # ---------------------------------------------------------
    # STEP 2: Map to Bengaluru Zones (Spatial Scaling)
    # ---------------------------------------------------------
    print("🗺️ 2. Scaling load profile across Bengaluru zones...")
    zones_path = os.path.join(DATA_DIR, 'bengaluru_zones.csv')
    try:
        zones_df = pd.read_csv(zones_path)
    except FileNotFoundError:
        print("❌ Missing bengaluru_zones.csv")
        return
    
    zone_data = []
    for _, zone in zones_df.iterrows():
        z_df = base_load_df.copy()
        z_df['zone_id'] = str(zone['zone_id'])
        
        multiplier = 2.5 if zone['landuse'] == 'commercial' else 1.0
        z_df['load_kwh'] = z_df['load_kwh'] * multiplier
        z_df['load_kwh'] += np.random.normal(0, 2.0, len(z_df))
        z_df['load_kwh'] = z_df['load_kwh'].clip(lower=0.1) 
        zone_data.append(z_df)

    final_df = pd.concat(zone_data, ignore_index=True)
    
    # 🛑 THE RAM SAVER: Downcast to lightweight data types
    final_df['load_kwh'] = final_df['load_kwh'].astype('float32')
    
    # ---------------------------------------------------------
    # STEP 3: Feature Engineering (Memory & Context)
    # ---------------------------------------------------------
    print("⚙️ 3. Engineering Autoregressive Lag Features...")
    final_df = final_df.sort_values(['zone_id', 'time']).reset_index(drop=True)

    # Time Features
    final_df['hour'] = final_df['time'].dt.hour.astype('int8')
    final_df['minute'] = final_df['time'].dt.minute.astype('int8')
    final_df['day_of_week'] = final_df['time'].dt.dayofweek.astype('int8')
    final_df['is_weekend'] = final_df['day_of_week'].isin([5, 6]).astype('int8')

    # Lag Features
    final_df['lag_15m'] = final_df.groupby('zone_id')['load_kwh'].shift(1)
    final_df['lag_1h'] = final_df.groupby('zone_id')['load_kwh'].shift(4)
    final_df['lag_24h'] = final_df.groupby('zone_id')['load_kwh'].shift(96)

    # Rolling Momentum
    final_df['rolling_mean_2h'] = final_df.groupby('zone_id')['load_kwh'].transform(
        lambda x: x.shift(1).rolling(window=8, min_periods=1).mean()
    )

    # Clean up NaNs created by the 24-hour shift (first 96 rows of each zone)
    initial_len = len(final_df)
    final_df = final_df.dropna()
    print(f"✂️ Dropped {initial_len - len(final_df)} NaN rows caused by shifting.")

    # ---------------------------------------------------------
    # STEP 4: Export
    # ---------------------------------------------------------
    export_path = os.path.join(DATA_DIR, 'lgbm_feature_matrix.csv')
    final_df.to_csv(export_path, index=False)
    print(f"✅ SUCCESS! Matrix saved to: {os.path.abspath(export_path)}")
    print(f"📊 Final Dataset Shape: {final_df.shape}")

if __name__ == "__main__":
    process_phase1()