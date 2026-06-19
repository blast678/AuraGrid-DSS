package main

import (
	"auragrid/core-api/internal/ai"
	"fmt"
)

func main() {
	fmt.Println("🚀 Testing Go -> Python AI Connection...")

	// 1. Create a dummy history of 96 blocks (24 hours of 50.0 kWh)
	dummyHistory := make([]float64, 96)
	for i := range dummyHistory {
		dummyHistory[i] = 50.0
	}

	// 2. Call the function you just updated!
	predictions, err := ai.GetPredictions("1000087221", dummyHistory)
	if err != nil {
		fmt.Printf("❌ Connection Failed: %v\n", err)
		return
	}

	// 3. Print the results
	fmt.Printf("✅ SUCCESS! Go successfully talked to Python and received %d predictions.\n", len(predictions))
	fmt.Printf("🔮 First Prediction -> Time: %s | Load: %.2f kWh\n", predictions[0].Timestamp, predictions[0].PredictedLoadKwh)
	fmt.Printf("🔮 Last Prediction  -> Time: %s | Load: %.2f kWh\n", predictions[95].Timestamp, predictions[95].PredictedLoadKwh)
}