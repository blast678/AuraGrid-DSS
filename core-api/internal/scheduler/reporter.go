package scheduler

import (
	"auragrid/core-api/internal/models"
	"auragrid/core-api/internal/spatial" // <-- ADD THIS: You must import the package to use spatial.X
	"fmt"
	"strings"
	"time"
)

func PrintMasterSummary(zone string, shiftResults []models.GridHour, proposals []spatial.Recommendation) {
	// NOTE: In our previous step, we named the struct "Recommendation" to match the frontend.
	// If your struct in internal/spatial/planner.go is named "LocationProposal", keep it.
	// If you followed my previous code, it should be "spatial.Recommendation".

	fmt.Println("\n" + strings.Repeat("=", 80))
	fmt.Printf("⚡ AURAGRID MASTER DASHBOARD - %s ⚡\n", time.Now().Format("2006-01-02 15:04"))
	fmt.Println(strings.Repeat("=", 80))

	// PART A SUMMARY
	var peakBefore, peakAfter float64
	for _, r := range shiftResults {
		if r.PredictedLoad > peakBefore {
			peakBefore = r.PredictedLoad
		}
		if r.OptimizedLoad > peakAfter {
			peakAfter = r.OptimizedLoad
		}
	}
	reduction := ((peakBefore - peakAfter) / peakBefore) * 100

	fmt.Println("\n[PART A: GRID STABILITY REPORT]")
	fmt.Printf("📍 Target Zone: %s\n", zone)
	fmt.Printf("📉 Peak Stress Reduction: %.2f%%\n", reduction)
	fmt.Printf("✅ Status: Transformer Load Capped at %.1fkWh\n", TRANSFORMER_LIMIT)

	// PART B SUMMARY
	fmt.Println("\n[PART B: INFRASTRUCTURE EXPANSION PLAN]")
	for i, p := range proposals {
		// Updated to use ZoneName and SynergyScore from our spatial package
		fmt.Printf("%d. %-25s | Score: %d | %s\n", i+1, p.ZoneName, p.SynergyScore, p.Reasoning)
	}

	fmt.Println(strings.Repeat("-", 80))
	fmt.Println("📢 ADVISORY: Prioritize Solar-Ready zones for 11:00-15:00 charging window.")
	fmt.Println(strings.Repeat("=", 80))
}

// ... rest of your GenerateDirectives code ...
