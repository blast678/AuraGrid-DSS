package api

import (
	"auragrid/core-api/internal/ai"
	"auragrid/core-api/internal/spatial"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

func GetForecastHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	zone := r.URL.Query().Get("zone")
	if zone == "" {
		zone = "1000087221" // Default to our trained AI zone
	}

	// 1. Simulate recent history (In production, this pulls from TimescaleDB)
	dummyHistory := make([]float64, 96)
	for i := range dummyHistory {
		dummyHistory[i] = 50.0 
	}

	// 2. LIVE AI INFERENCE: Ask Python for the next 24 hours
	predictions, err := ai.GetPredictions(zone, dummyHistory)
	if err != nil {
		http.Error(w, fmt.Sprintf(`{"error": "%v"}`, err), http.StatusInternalServerError)
		return
	}

	// 3. LIVE WATER-FILLING ALGORITHM (The BESCOM Saver)
	var data []map[string]interface{}
	
	// Transformer limit is 25.0 kWh. Anything above this will blow up the transformer!
	transformerLimit := 25.0 
	var shiftedExcess float64 = 0.0

	for _, pt := range predictions {
		optimized := pt.PredictedLoadKwh
		isShifted := false

		// A. PEAK SHAVING: If the AI predicts a spike over 25 kWh, cap it!
		if pt.PredictedLoadKwh > transformerLimit {
			excess := pt.PredictedLoadKwh - transformerLimit
			shiftedExcess += excess     // Save the excess energy to be charged later
			optimized = transformerLimit // Throttle the smart chargers
			isShifted = true
		} else if shiftedExcess > 0 && pt.PredictedLoadKwh < (transformerLimit - 5.0) {
			// B. VALLEY FILLING: If the grid is quiet (off-peak), dump the shifted charging here!
			fillAmount := (transformerLimit - 5.0) - pt.PredictedLoadKwh
			if fillAmount > shiftedExcess {
				fillAmount = shiftedExcess
			}
			optimized += fillAmount
			shiftedExcess -= fillAmount
		}

		data = append(data, map[string]interface{}{
			"timestamp":      pt.Timestamp,
			"predicted_load": pt.PredictedLoadKwh, // The raw AI hallucination (Blue Line)
			"optimized_load": optimized,           // The Water-Filled reality (Green Line)
			"is_shifted":     isShifted,
		})
	}

	json.NewEncoder(w).Encode(data)
}

func GetRecommendationsHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	recommendations := spatial.GetTopRecommendations()
	json.NewEncoder(w).Encode(recommendations)
}

func GetDirectivesHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	
	directives := []map[string]interface{}{
		{
			"id": "DIR-1", "severity": "ACTION_REQUIRED", "zone": "1000087221",
			"message":   "ACTION REQUIRED: Throttle smart chargers by 25.6% — AI forecast predicts grid limit breach at 00:00.",
			"timestamp": time.Now().Format(time.RFC3339),
		},
		{
			"id": "DIR-2", "severity": "NOMINAL", "zone": "1000087221",
			"message":   "NOMINAL: Water-filling optimization active — Peak reduction achieved and shifted to 08:00 Off-Peak.",
			"timestamp": time.Now().Add(-10 * time.Minute).Format(time.RFC3339),
		},
	}
	json.NewEncoder(w).Encode(directives)
}

func GetLogsHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	json.NewEncoder(w).Encode([]map[string]interface{}{})
}