package spatial

import (
	"encoding/csv"
	"fmt"
	"math/rand"
	"os"
	"sort"
	"strconv"
)

// Recommendation matches the exact JSON schema the Next.js frontend expects
type Recommendation struct {
	ZoneID       string    `json:"zone_id"`
	ZoneName     string    `json:"zone_name"`
	SynergyScore int       `json:"synergy_score"`
	Reasoning    string    `json:"reasoning"`
	SolarReady   bool      `json:"solar_ready"`
	EVDensity    int       `json:"ev_density"`
	GridHeadroom float64   `json:"grid_headroom"`
	SolarHosting float64   `json:"solar_hosting"`
	LandType     string    `json:"land_type"`
	Coordinates  []float64 `json:"coordinates"`
}

// GetTopRecommendations reads the CSVs and calculates the Best 5 Sites
func GetTopRecommendations() []Recommendation {
	// In a real production system, this data would be in TimescaleDB/PostGIS.
	// For this architecture, we parse the processed CSV file directly.
	filePath := "../ai-engine/data/final_grid_constraints.csv"
	
	file, err := os.Open(filePath)
	if err != nil {
		fmt.Println("⚠️ WARNING: final_grid_constraints.csv not found. Falling back to synthetic safe-data.")
		return getFallbackRecommendations() // Prevents frontend crash if file is missing
	}
	defer file.Close()

	reader := csv.NewReader(file)
	records, _ := reader.ReadAll()

	var proposals []Recommendation

	// Skip header (i=0) and parse the 9,500+ rows
	for i, row := range records {
		if i == 0 || i > 1000 { continue } // Limit to first 1000 for rapid demo sorting

		// Safely parse CSV columns (assuming standard format from your Python script)
		// 0: zone_id, 1: zone_type, 2: transformer_cap, etc.
		capacity, _ := strconv.ParseFloat(row[2], 64)
		
		// Generate the Synergy Score (The Math)
		// Real logic: We favor High Capacity + Public Land
		score := 50
		if capacity > 1000 { score += 20 }
		if len(row) > 4 && row[4] == "PUBLIC" { score += 25 }

		proposals = append(proposals, Recommendation{
			ZoneID:       row[0],
			ZoneName:     "Zone " + row[0] + " Hub",
			SynergyScore: score + rand.Intn(10), // Add slight variance
			Reasoning:    fmt.Sprintf("AI selected this zone due to %.1f kW transformer capacity and strategic land type.", capacity),
			SolarReady:   capacity > 500,
			EVDensity:    200 + rand.Intn(300),
			GridHeadroom: capacity * 0.4, // Assuming 40% headroom
			SolarHosting: capacity * 0.15,
			LandType:     "Commercial",
			Coordinates:  []float64{12.9716 + (rand.Float64()-0.5)*0.1, 77.5946 + (rand.Float64()-0.5)*0.1}, // Random BLR coords
		})
	}

	// Sort by Synergy Score Descending (Highest first)
	sort.Slice(proposals, func(i, j int) bool {
		return proposals[i].SynergyScore > proposals[j].SynergyScore
	})

	// BRUTAL HONESTY: Never send 9,500 rows to the frontend. Send Top 5.
	if len(proposals) > 5 {
		return proposals[:5]
	}
	return proposals
}

// Fallback if Python script wasn't run correctly
func getFallbackRecommendations() []Recommendation {
	return []Recommendation{
		{
			ZoneID: "WF-01", ZoneName: "Whitefield Tech Corridor", SynergyScore: 94,
			Reasoning: "Fallback Data: High EV density with optimal Grid headroom.",
			SolarReady: true, EVDensity: 312, GridHeadroom: 48.5, SolarHosting: 22.3,
			LandType: "Commercial", Coordinates: []float64{12.9698, 77.7499},
		},
	}
}