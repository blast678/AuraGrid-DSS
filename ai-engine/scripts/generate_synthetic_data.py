import pandas as pd
import numpy as np

def seed_synthetic_universe():
    print("🚀 Seeding High-Fidelity Bengaluru EV Universe...")

    # 1. LOAD YOUR REAL ZONES (The Foundation)
    zones = pd.read_csv('../data/bengaluru_zones.csv')
    
    # 2. GENERATE CHARGERS (Inside your real zones)
    chargers_list = []
    # We will put 2-5 chargers in every commercial zone and 1 in residential
    for _, zone in zones.iterrows():
        num_chargers = 5 if zone['landuse'] == 'commercial' else 1
        for i in range(num_chargers):
            # Add a tiny random offset so they aren't all on top of each other
            offset_lat = np.random.uniform(-0.002, 0.002)
            offset_lon = np.random.uniform(-0.002, 0.002)
            
            chargers_list.append({
                'charger_id': 500000 + len(chargers_list),
                'name': f"Station_{zone['name']}_{i}",
                'lat': 12.97 + offset_lat if pd.isna(zone.get('lat')) else zone.get('lat') + offset_lat,
                'lon': 77.59 + offset_lon if pd.isna(zone.get('lon')) else zone.get('lon') + offset_lon,
                'city': 'Bengaluru',
                'operator': 'BESCOM' if i == 0 else 'PRIVATE'
            })
    
    chargers_df = pd.DataFrame(chargers_list)
    chargers_df.to_csv('../data/processed_chargers.csv', index=False)
    print(f"✅ Generated {len(chargers_df)} Synthetic Chargers inside REAL zones.")

    # 3. GENERATE ADOPTION PROXY (Mapped to your RTO zones)
    # We use a scale of 5k to 30k EVs per zone
    adoption_data = []
    rto_list = ['KA-01', 'KA-02', 'KA-03', 'KA-04', 'KA-05', 'KA-41', 'KA-50', 'KA-51', 'KA-53']
    for rto in rto_list:
        adoption_data.append({
            'rto_code': rto,
            'registered_2w_evs': np.random.randint(5000, 25000),
            'registered_4w_evs': np.random.randint(1000, 8000)
        })
    
    adoption_df = pd.DataFrame(adoption_data)
    adoption_df.to_csv('../data/vahan_ev_adoption_proxy.csv', index=False)
    print("✅ Generated Vahan Proxy data for 9 Bengaluru RTOs.")

if __name__ == "__main__":
    seed_synthetic_universe()