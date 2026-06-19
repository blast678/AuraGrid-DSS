package main

import (
	"context"
	"crypto/tls"
	"encoding/json"
	"log"
	"net/http"
	"os"

	"auragrid/core-api/internal/api"
	"auragrid/core-api/internal/db"

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

	kafkaURL := os.Getenv("KAFKA_BROKER")
	if kafkaURL == "" {
		kafkaURL = "kafka:9092" // Default to internal Docker network
	}
	
	dbURL := os.Getenv("DB_URL")
	if dbURL == "" {
		dbURL = "postgres://bescom_admin:grid_secure_pass@auragrid-db:5432/auragrid?sslmode=disable"
	}
	
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// 1. Initialize Global Database Pool
	db.InitDB(dbURL)
	defer db.CloseDB()

	// 2. Start Kafka Sink Worker in the background
	// 2. Start Kafka Sink Worker in the background
	go startKafkaSink(kafkaURL, os.Getenv("KAFKA_USER"), os.Getenv("KAFKA_PASS"))
	// 3. Register HTTP Routes
	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"status": "Core API Live"})
	})
	http.HandleFunc("/api/forecast", api.GetForecastHandler)
	http.HandleFunc("/api/recommendations", api.GetRecommendationsHandler)
	http.HandleFunc("/api/directives", api.GetDirectivesHandler)
	http.HandleFunc("/api/logs", api.GetLogsHandler)

	log.Printf("⚡ Core API listening on port %s...\n", port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}

// startKafkaSink connects to Kafka and dumps to Postgres
// startKafkaSink connects to Kafka and dumps to Postgres via the global pool
func startKafkaSink(kafkaURL, user, pass string) {
	// BRUTAL FIX: Use the global pgx pool to ensure the table exists
	_, err := db.Pool.Exec(context.Background(), `CREATE TABLE IF NOT EXISTS grid_telemetry (time TIMESTAMPTZ DEFAULT NOW(), zone_id TEXT, load_kwh FLOAT)`)
	if err != nil {
		log.Printf("⚠️ Warning: Table check failed: %v", err)
	}

	var dialer *kafka.Dialer
	if user != "" && pass != "" {
		// AIVEN ENTERPRISE MODE
		mechanism, _ := scram.Mechanism(scram.SHA256, user, pass)
		dialer = &kafka.Dialer{
			SASLMechanism: mechanism,
			TLS:           &tls.Config{},
		}
		log.Println("🔒 Using Secure TLS/SCRAM for Kafka...")
	} else {
		// LOCAL DOCKER MODE
		dialer = &kafka.Dialer{}
		log.Println("🔓 Using Plaintext for Local Kafka...")
	}

	reader := kafka.NewReader(kafka.ReaderConfig{
		Brokers: []string{kafkaURL},
		Topic:   "grid-load-events",
		GroupID: "auragrid-sink",
		Dialer:  dialer,
	})

	log.Printf("✅ Kafka Sink Connected to %s! Waiting for events...\n", kafkaURL)

	for {
		m, err := reader.ReadMessage(context.Background())
		if err != nil {
			continue
		}
		var event GridEvent
		json.Unmarshal(m.Value, &event)
		
		// BRUTAL FIX: Insert data using the highly optimized global connection pool
		_, err = db.Pool.Exec(context.Background(), "INSERT INTO grid_telemetry (zone_id, load_kwh) VALUES ($1, $2)", event.ZoneID, event.LoadKWh)
		if err == nil {
			log.Printf("💾 Sunk event to Data Lake: %s -> %.2f kWh", event.ZoneID, event.LoadKWh)
		} else {
			log.Printf("❌ DB Insert Failed: %v", err)
		}
	}
}