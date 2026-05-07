import pandas as pd
import numpy as np

def calculate_synergy_scores(zones_df, vahan_df, grid_df, infra_df):
    """
    Brutally honest logic: We penalize grid stress and reward solar/public land.
    """
    # 1. Merge datasets on 'zone_id'
    df = zones_df.merge(vahan_df, on='zone_id').merge(grid_df, on='zone_id')
    
    # 2. Calculate the 'Raw Demand'
    # We boost commercial zones because they support 'Opportunity Charging'
    df['raw_demand'] = df['ev_count'] * df['commercial_activity_index']
    
    # 3. Apply the Solar Bonus
    # High solar hosting = High efficiency for 10am-4pm charging
    df['solar_boost'] = df['solar_capacity_kw'] * 0.5
    
    # 4. Apply the 'Grid & Competition' Penalties
    # If grid_utilization is > 80%, the penalty becomes exponential
    df['grid_penalty'] = np.exp(df['grid_utilization_pct'] / 20)
    
    # Competition penalty: subtract points if existing_chargers > 2
    df['comp_penalty'] = df['existing_charger_count'] * 10
    
    # 5. The Land Viability Filter (The "Actionability" Factor)
    # 1 = Public/BESCOM Land, 0.2 = Expensive Private Land
    df['land_score'] = df['land_type'].map({'PUBLIC': 1.0, 'BESCOM': 1.2, 'PRIVATE': 0.2})
    
    # 6. Final Synergy Score
    df['synergy_score'] = ((df['raw_demand'] + df['solar_boost']) / 
                           (df['grid_penalty'] + df['comp_penalty'])) * df['land_score']
    
    # Return Top 5 sorted by Score
    return df.sort_values(by='synergy_score', ascending=False).head(5)