package ai

import (
	"encoding/json"
	"fmt"
	"net/http"
)

type ForecastPoint struct {
	Ds   string  `json:"ds"`
	Yhat float64 `json:"yhat"`
}

func GetPredictions(horizonHours int) ([]ForecastPoint, error) {
	url := fmt.Sprintf("http://localhost:8000/predict?horizon_hours=%d", horizonHours)

	resp, err := http.Post(url, "application/json", nil)
	if err != nil {
		return nil, fmt.Errorf("❌ AI Engine unreachable: %v", err)
	}
	defer resp.Body.Close()

	var points []ForecastPoint
	if err := json.NewDecoder(resp.Body).Decode(&points); err != nil {
		return nil, fmt.Errorf("❌ Failed to decode AI response: %v", err)
	}

	return points, nil
}
