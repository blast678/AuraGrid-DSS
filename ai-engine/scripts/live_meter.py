import json
import time
import random
from kafka import KafkaProducer
from datetime import datetime

# BRUTAL TRUTH: We connect to the external exposed port (9094) 
# because this script runs on your laptop, outside the Docker network.
KAFKA_BROKER = "localhost:9094"
TOPIC = "grid-load-events"

print(f"🔌 Connecting BESCOM Smart Meter to {KAFKA_BROKER}...")

try:
    producer = KafkaProducer(
        bootstrap_servers=KAFKA_BROKER,
        value_serializer=lambda v: json.dumps(v).encode('utf-8')
    )
    print("✅ Connected! Streaming live grid telemetry...\n")
    
    zones = ["Koramangala", "Whitefield", "Indiranagar", "Electronic City"]
    
    # Simulate 50 live events pumping into the grid
    for i in range(50):
        # Generate realistic load spikes
        base_load = random.uniform(40.0, 55.0)
        # Randomly trigger a massive EV spike (above the 60.0 limit)
        if random.random() > 0.8:
            base_load += random.uniform(15.0, 30.0)
            
        payload = {
            "zone_id": random.choice(zones),
            "load_kwh": round(base_load, 2),
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
        
        producer.send(TOPIC, value=payload)
        print(f"⚡ [SENT] {payload['zone_id']}: {payload['load_kwh']} kWh")
        time.sleep(0.5) # Send 2 events per second

    producer.flush()
    print("\n🏁 Stream complete. Check the Go API logs!")

except Exception as e:
    print(f"❌ Connection Failed: {e}")