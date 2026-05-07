package main

import (
	"context"
	"crypto/tls"
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"os"

	_ "github.com/lib/pq"
	"github.com/segmentio/kafka-go"
	"github.com/segmentio/kafka-go/sasl/scram"
)

type GridEvent struct {
	ZoneID  string  `json:"zone_id"`
	LoadKWh float64 `json:"load_kwh"`
}

func main() {
	log.Println("🚀 Booting AuraGrid Core API...")

	// 1. Load Environment Variables
	kafkaURL := os.Getenv("KAFKA_BROKER")
	kafkaUser := os.Getenv("KAFKA_USER")
	kafkaPass := os.Getenv("KAFKA_PASS")
	dbURL := os.Getenv("DB_URL")
	port := os.Getenv("PORT") // Render dynamic port
	if port == "" {
		port = "8080" // Fallback for localhost
	}

	// 2. Start Kafka Sink Worker in the background
	if kafkaURL != "" && dbURL != "" {
		go startKafkaSink(kafkaURL, kafkaUser, kafkaPass, dbURL)
	} else {
		log.Println("⚠️ KAFKA_BROKER or DB_URL missing. Skipping Kafka Sink.")
	}

	// 3. Setup HTTP Server for Next.js
	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("Access-Control-Allow-Origin", "*")
		json.NewEncoder(w).Encode(map[string]string{"status": "Core API Live (Muscle)", "mode": "Water-Filling Armed"})
	})

	log.Printf("⚡ Core API listening on port %s...\n", port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}

// startKafkaSink connects to Aiven Kafka and dumps to Aiven Postgres
func startKafkaSink(kafkaURL, user, pass, dbURL string) {
	// Connect Postgres
	db, err := sql.Open("postgres", dbURL)
	if err != nil {
		log.Printf("❌ DB Connection Error: %v", err)
		return
	}
	db.Exec(`CREATE TABLE IF NOT EXISTS grid_telemetry (time TIMESTAMPTZ DEFAULT NOW(), zone_id TEXT, load_kwh FLOAT)`)

	// Connect Aiven Kafka (Secure TLS)
	mechanism, _ := scram.Mechanism(scram.SHA256, user, pass)
	dialer := &kafka.Dialer{
		SASLMechanism: mechanism,
		TLS:           &tls.Config{},
	}
	reader := kafka.NewReader(kafka.ReaderConfig{
		Brokers: []string{kafkaURL},
		Topic:   "grid-load-events",
		GroupID: "auragrid-sink",
		Dialer:  dialer,
	})

	log.Println("✅ Aiven Kafka Sink Connected! Waiting for events...")

	for {
		m, err := reader.ReadMessage(context.Background())
		if err != nil {
			continue
		}
		var event GridEvent
		json.Unmarshal(m.Value, &event)
		
		// Dump to Data Lake
		_, err = db.Exec("INSERT INTO grid_telemetry (zone_id, load_kwh) VALUES ($1, $2)", event.ZoneID, event.LoadKWh)
		if err == nil {
			log.Printf("💾 Sunk event to Data Lake: %s -> %.2f kWh", event.ZoneID, event.LoadKWh)
		}
	}
}