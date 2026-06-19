package ai

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
)

// The new LightGBM response format
type ForecastPoint struct {
	Timestamp          string  `json:"timestamp"`
	PredictedLoadKwh   float64 `json:"predicted_load_kwh"`
}

// The new LightGBM request format
type PredictRequest struct {
	ZoneID           string    `json:"zone_id"`
	RecentHistoryKwh []float64 `json:"recent_history_kwh"`
	HorizonBlocks    int       `json:"horizon_blocks"`
}

func GetPredictions(zoneID string, recentHistory []float64) ([]ForecastPoint, error) {
	url := "http://localhost:8000/predict"

	// 1. Build the payload with the historical memory for LightGBM
	payload := PredictRequest{
		ZoneID:           zoneID,
		RecentHistoryKwh: recentHistory,
		HorizonBlocks:    96, // 24 hours of 15-min blocks
	}

	jsonData, err := json.Marshal(payload)
	if err != nil {
		return nil, fmt.Errorf("❌ Failed to marshal request: %v", err)
	}

	// 2. Send the POST request to the Python AI Engine
	resp, err := http.Post(url, "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, fmt.Errorf("❌ AI Engine unreachable: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("❌ AI Engine rejected request with status: %d", resp.StatusCode)
	}

	// 3. Decode the 96 future predictions
	var points []ForecastPoint
	if err := json.NewDecoder(resp.Body).Decode(&points); err != nil {
		return nil, fmt.Errorf("❌ Failed to decode AI response: %v", err)
	}

	return points, nil
}