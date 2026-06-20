package ai

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
)

// --- PART A: PREDICTION STRUCTS ---
type ForecastPoint struct {
	Timestamp        string  `json:"timestamp"`
	PredictedLoadKwh float64 `json:"predicted_load_kwh"`
}

type PredictRequest struct {
	ZoneID           string    `json:"zone_id"`
	RecentHistoryKwh []float64 `json:"recent_history_kwh"`
	HorizonBlocks    int       `json:"horizon_blocks"`
}

// --- PART B: LOCATION PLANNING STRUCTS ---
type ZoneData struct {
	ZoneName         string  `json:"zone_name"`
	EVDensity        int     `json:"ev_density"`
	GridUtilization  float64 `json:"grid_utilization"`
	ExistingChargers int     `json:"existing_chargers"`
}

type LocationRequest struct {
	Zones []ZoneData `json:"zones"`
}

type LocationRecommendation struct {
	Zone             string  `json:"zone"`
	SynergyScore     float64 `json:"synergy_score"`
	EVDensity        int     `json:"ev_density"`
	GridStressPct    float64 `json:"grid_stress_pct"`
	ExistingChargers int     `json:"existing_chargers"`
}

// Helper to get the correct URL whether running locally or in Docker
func getAIBaseURL() string {
	// If running inside Docker Compose, it uses the service name "ai-engine"
	if os.Getenv("KUBERNETES_PORT") != "" || os.Getenv("HOSTNAME") != "" {
		return "http://ai-engine:8000"
	}
	return "http://localhost:8000"
}

// PART A: Predict Future Load
func GetPredictions(zoneID string, recentHistory []float64) ([]ForecastPoint, error) {
	url := getAIBaseURL() + "/predict"

	payload := PredictRequest{
		ZoneID:           zoneID,
		RecentHistoryKwh: recentHistory,
		HorizonBlocks:    96,
	}

	jsonData, err := json.Marshal(payload)
	if err != nil {
		return nil, fmt.Errorf("❌ Failed to marshal request: %v", err)
	}

	resp, err := http.Post(url, "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, fmt.Errorf("❌ AI Engine unreachable: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("❌ AI Engine rejected request with status: %d", resp.StatusCode)
	}

	var points []ForecastPoint
	if err := json.NewDecoder(resp.Body).Decode(&points); err != nil {
		return nil, fmt.Errorf("❌ Failed to decode AI response: %v", err)
	}

	return points, nil
}

// PART B: Get Location Recommendations
func GetLocationRecommendations(zones []ZoneData) ([]LocationRecommendation, error) {
	url := getAIBaseURL() + "/recommend-locations"

	payload := LocationRequest{
		Zones: zones,
	}

	jsonData, err := json.Marshal(payload)
	if err != nil {
		return nil, fmt.Errorf("❌ Failed to marshal location request: %v", err)
	}

	resp, err := http.Post(url, "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, fmt.Errorf("❌ AI Engine unreachable for locations: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("❌ AI Engine rejected location request with status: %d", resp.StatusCode)
	}

	var recommendations []LocationRecommendation
	if err := json.NewDecoder(resp.Body).Decode(&recommendations); err != nil {
		return nil, fmt.Errorf("❌ Failed to decode Location AI response: %v", err)
	}

	return recommendations, nil
}