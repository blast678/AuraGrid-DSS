package models

import "time"

// GridHour represents one hour of electricity data
type GridHour struct {
	Timestamp     time.Time `json:"timestamp"`
	PredictedLoad float64   `json:"predicted_load"`
	OptimizedLoad float64   `json:"optimized_load"`
	IsShifted     bool      `json:"is_shifted"`
}
