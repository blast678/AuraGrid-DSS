package main

import (
	"auragrid/core-api/internal/api"
	"auragrid/core-api/internal/db"
	"fmt"
	"log"
	"net/http"
	"crypto/tls"
	"log"
	"os"

	"github.com/segmentio/kafka-go"
	"github.com/segmentio/kafka-go/sasl/scram"
	"github.com/rs/cors"
)

func main() {
	fmt.Println("⚡ AuraGrid Main Server Initializing...")
	// 1. Pull the Aiven credentials from Render environment variables
	brokerAddress := os.Getenv("KAFKA_BROKER") // e.g., kafka-xyz.aivencloud.com:26720
	username := os.Getenv("KAFKA_USER")
	password := os.Getenv("KAFKA_PASS")

	// 2. Configure SCRAM authentication (Aiven standard)
	mechanism, err := scram.Mechanism(scram.SHA256, username, password)
	if err != nil {
		log.Fatalf("Failed to configure SCRAM: %v", err)
	}

	// 3. Configure the secure TLS Dialer
	dialer := &kafka.Dialer{
		SASLMechanism: mechanism,
		TLS:           &tls.Config{}, // Aiven requires TLS
	}

	// 4. Initialize the Kafka Reader
	reader := kafka.NewReader(kafka.ReaderConfig{
		Brokers: []string{brokerAddress},
		Topic:   "grid-load-events",
		GroupID: "auragrid-consumer-group",
		Dialer:  dialer,
	})

	log.Println("✅ Successfully connected to Aiven Kafka!")
	// 1. Boot up Database Connection
	db.InitDB()
	defer db.CloseDB()

	// 2. Set up the Router
	mux := http.NewServeMux()

	// Mount the 4 Frontend Endpoints
	mux.HandleFunc("/api/forecast", api.GetForecastHandler)
	mux.HandleFunc("/api/recommendations", api.GetRecommendationsHandler)
	mux.HandleFunc("/api/directives", api.GetDirectivesHandler)
	mux.HandleFunc("/api/logs", api.GetLogsHandler)

	// 3. Configure CORS (Critical for Next.js on Port 3000)
	handler := cors.New(cors.Options{
		AllowedOrigins:   []string{"http://localhost:3000"},
		AllowedMethods:   []string{"GET", "POST", "OPTIONS"},
		AllowedHeaders:   []string{"Content-Type", "Authorization"},
		AllowCredentials: true,
	}).Handler(mux)

	// 4. Start Server
	fmt.Println("✅ ALL SYSTEMS GO: API Service live on http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", handler))
}
