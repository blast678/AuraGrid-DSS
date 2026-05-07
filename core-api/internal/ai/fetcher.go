package ai

import (
	"encoding/json"
	"fmt"
	"net/http"
)

type Prediction struct {
	Ds   string  `json:"ds"`
	Yhat float64 `json:"yhat"`
}

func FetchForecast(hours int) ([]Prediction, error) {
	// Calling your local Python AI Engine
	url := fmt.Sprintf("http://127.0.0.1:8000/predict?horizon_hours=%d", hours)
	resp, err := http.Post(url, "application/json", nil)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var data []Prediction
	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		return nil, err
	}
	return data, nil
}
