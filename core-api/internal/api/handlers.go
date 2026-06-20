package api

import (
	"auragrid/core-api/internal/ai"
	"auragrid/core-api/internal/db"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

// PART A: Get Forecast and Run Water-Filling
func GetForecastHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	zone := r.URL.Query().Get("zone")
	if zone == "" {
		zone = "1000087221"
	}

	var realHistory []float64

	query := `
		SELECT load_kwh 
		FROM grid_telemetry 
		WHERE zone_id = $1 
		ORDER BY time DESC 
		LIMIT 96
	`
	
	if db.Pool != nil {
		rows, err := db.Pool.Query(context.Background(), query, zone)
		if err == nil {
			defer rows.Close()
			for rows.Next() {
				var load float64
				if err := rows.Scan(&load); err == nil {
					realHistory = append(realHistory, load)
				}
			}
		}
	}

	if len(realHistory) < 96 {
		needed := 96 - len(realHistory)
		for i := 0; i < needed; i++ {
			realHistory = append(realHistory, 50.0) 
		}
	}

	for i, j := 0, len(realHistory)-1; i < j; i, j = i+1, j-1 {
		realHistory[i], realHistory[j] = realHistory[j], realHistory[i]
	}

	predictions, err := ai.GetPredictions(zone, realHistory)
	if err != nil {
		http.Error(w, fmt.Sprintf(`{"error": "%v"}`, err), http.StatusInternalServerError)
		return
	}

	var data []map[string]interface{}
	transformerLimit := 25.0 
	var shiftedExcess float64 = 0.0

	for _, pt := range predictions {
		optimized := pt.PredictedLoadKwh
		isShifted := false

		if pt.PredictedLoadKwh > transformerLimit {
			excess := pt.PredictedLoadKwh - transformerLimit
			shiftedExcess += excess     
			optimized = transformerLimit 
			isShifted = true
		} else if shiftedExcess > 0 && pt.PredictedLoadKwh < (transformerLimit - 5.0) {
			fillAmount := (transformerLimit - 5.0) - pt.PredictedLoadKwh
			if fillAmount > shiftedExcess {
				fillAmount = shiftedExcess
			}
			optimized += fillAmount
			shiftedExcess -= fillAmount
		}

		data = append(data, map[string]interface{}{
			"timestamp":      pt.Timestamp,
			"predicted_load": pt.PredictedLoadKwh,
			"optimized_load": optimized,
			"is_shifted":     isShifted,
		})
	}

	json.NewEncoder(w).Encode(data)
}

// ---------------------------------------------------------
// PART B: Live Infrastructure Location Planning
// ---------------------------------------------------------

// 1. The FULL response struct matching exactly what React expects
type RecommendationResponse struct {
	ZoneID       string    `json:"zone_id"`
	ZoneName     string    `json:"zone_name"`
	SynergyScore float64   `json:"synergy_score"`
	Coordinates  []float64 `json:"coordinates"`
	EVDensity    int       `json:"ev_density"`
	GridHeadroom float64   `json:"grid_headroom"`
	SolarHosting float64   `json:"solar_hosting"`
	LandType     string    `json:"land_type"`
	SolarReady   bool      `json:"solar_ready"`
	Reasoning    string    `json:"reasoning"`
}

// 2. The Lookup Table holding geographical & planning data
var ZoneLookup = map[string]struct {
	ID        string
	Coord     []float64
	LandType  string
	Solar     bool
	Headroom  float64
	Hosting   float64
	Reasoning string
}{
	"Electronic City": {
		ID: "EC-01", Coord: []float64{12.840, 77.680}, LandType: "Industrial", Solar: true,
		Headroom: 61.2, Hosting: 38.0, Reasoning: "Industrial anchor tenants with predictable charging demand.",
	},
	"Indiranagar": {
		ID: "IND-01", Coord: []float64{12.978, 77.640}, LandType: "Commercial", Solar: true,
		Headroom: 15.8, Hosting: 7.2, Reasoning: "Metro Line connectivity enables park-and-charge use case.",
	},
	"Koramangala": {
		ID: "KOR-02", Coord: []float64{12.930, 77.620}, LandType: "Mixed", Solar: false,
		Headroom: 28.7, Hosting: 9.5, Reasoning: "Highest peak-to-off-peak EV charging ratio in Bengaluru.",
	},
	"Whitefield": {
		ID: "WF-01", Coord: []float64{12.969, 77.750}, LandType: "Commercial", Solar: true,
		Headroom: 48.5, Hosting: 22.3, Reasoning: "Extreme EV density from IT campuses with significant grid headroom.",
	},
	"HSR Layout": {
		ID: "BTM-01", Coord: []float64{12.908, 77.640}, LandType: "Residential", Solar: false,
		Headroom: 10.2, Hosting: 4.1, Reasoning: "Neighborhood EV charging pods recommended over fast-charge.",
	},
}

func GetRecommendationsHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	testZones := []ai.ZoneData{
		{ZoneName: "Electronic City", EVDensity: 1000, GridUtilization: 0.40, ExistingChargers: 0},
		{ZoneName: "Indiranagar", EVDensity: 1000, GridUtilization: 0.95, ExistingChargers: 5},
		{ZoneName: "Koramangala", EVDensity: 800, GridUtilization: 0.65, ExistingChargers: 2},
		{ZoneName: "Whitefield", EVDensity: 1200, GridUtilization: 0.75, ExistingChargers: 3},
		{ZoneName: "HSR Layout", EVDensity: 600, GridUtilization: 0.85, ExistingChargers: 4},
	}

	// Fetch Synergy Scores from AI Engine
	recommendations, _ := ai.GetLocationRecommendations(testZones)

    // NEW: Find the maximum score to normalize against
    var maxScore float64 = 0
    for _, rec := range recommendations {
        if rec.SynergyScore > maxScore {
            maxScore = rec.SynergyScore
        }
    }

    var response []RecommendationResponse
    for _, rec := range recommendations {
        info, exists := ZoneLookup[rec.Zone]
        if !exists {
            info = ZoneLookup["Whitefield"] 
        }

        // NEW: Normalize the score to a 0-100 scale
        normalizedScore := 0.0
        if maxScore > 0 {
            normalizedScore = (rec.SynergyScore / maxScore) * 100.0
        }

        response = append(response, RecommendationResponse{
            ZoneID:       info.ID,
            ZoneName:     rec.Zone,
            SynergyScore: normalizedScore, // Send the normalized score
            Coordinates:  info.Coord,
            EVDensity:    rec.EVDensity,
            GridHeadroom: info.Headroom,
            SolarHosting: info.Hosting,
            LandType:     info.LandType,
            SolarReady:   info.Solar,
            Reasoning:    info.Reasoning,
        })
    }
    json.NewEncoder(w).Encode(response)
}

// System Directives (For Dashboard Alerts)
func GetDirectivesHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	
	directives := []map[string]interface{}{
		{
			"id": "DIR-1", "severity": "ACTION_REQUIRED", "zone": "Indiranagar",
			"message":   "ACTION REQUIRED: Grid at 95% capacity. Reject new charger requests.",
			"timestamp": time.Now().Format(time.RFC3339),
		},
		{
			"id": "DIR-2", "severity": "NOMINAL", "zone": "Electronic City",
			"message":   "NOMINAL: High Synergy Score detected. Approving infrastructure expansion.",
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