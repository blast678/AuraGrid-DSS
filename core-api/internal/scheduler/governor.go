package scheduler

import (
	"auragrid/core-api/internal/models"
	"math"
)

const TRANSFORMER_LIMIT = 60.0

func BalanceGrid(rawPoints []models.GridHour) []models.GridHour {
	var totalExcess float64
	optimized := make([]models.GridHour, len(rawPoints))
	copy(optimized, rawPoints)

	// STEP 1: Surgical Peak Shaving
	for i := range optimized {
		if optimized[i].PredictedLoad > TRANSFORMER_LIMIT {
			totalExcess += (optimized[i].PredictedLoad - TRANSFORMER_LIMIT)
			optimized[i].OptimizedLoad = TRANSFORMER_LIMIT
			optimized[i].IsShifted = true
		} else {
			optimized[i].OptimizedLoad = optimized[i].PredictedLoad
		}
	}

	// STEP 2: Water-Filling Valley Distribution
	// We don't just divide by valleyCount. We fill the deepest holes first.
	for totalExcess > 0.1 { // While we still have energy to move
		// Find the hour with the ABSOLUTE lowest load that isn't a peak
		lowestIdx := -1
		minLoad := TRANSFORMER_LIMIT

		for i, p := range optimized {
			if p.OptimizedLoad < minLoad {
				minLoad = p.OptimizedLoad
				lowestIdx = i
			}
		}

		if lowestIdx == -1 {
			break
		} // Grid is full

		// Fill this hole slightly (e.g., by 1kWh or the remaining excess)
		fillAmount := math.Min(1.0, totalExcess)

		// SAFETY CHECK: Don't let the valley become a new peak!
		if optimized[lowestIdx].OptimizedLoad+fillAmount > TRANSFORMER_LIMIT {
			break // Nowhere left to put energy safely
		}

		optimized[lowestIdx].OptimizedLoad += fillAmount
		optimized[lowestIdx].IsShifted = true
		totalExcess -= fillAmount
	}

	return optimized
}
