package main

import (
	"auragrid-dss/core-api/internal/api"
	"auragrid-dss/core-api/internal/db"
	"fmt"
	"log"
	"net/http"

	"github.com/rs/cors"
)

func main() {
	fmt.Println("⚡ AuraGrid Main Server Initializing...")

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