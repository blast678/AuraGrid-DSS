package ingestion

import (
	"auragrid-dss/core-api/internal/ai"
	"auragrid-dss/core-api/internal/db"
	"auragrid-dss/core-api/internal/models"
	"auragrid-dss/core-api/internal/scheduler"
	"context"
	"fmt"
	"time"
)

func RunSync() {
	for {
		fmt.Println("🔄 Ingesting fresh AI data...")
		raw, _ := ai.FetchForecast(24)
		
		var gridData []models.GridHour
		for _, p := range raw {
			t, _ := time.Parse("2006-01-02T15:04:05", p.Ds)
			gridData = append(gridData, models.GridHour{Timestamp: t, PredictedLoad: p.Yhat})
		}

		balanced := scheduler.BalanceGrid(gridData)

		db.Pool.Exec(context.Background(), "DELETE FROM grid_forecasts")
		for _, p := range balanced {
			db.Pool.Exec(context.Background(), 
				"INSERT INTO grid_forecasts (timestamp, predicted_load_kwh, is_shifted) VALUES ($1, $2, $3)",
				p.Timestamp, p.OptimizedLoad, p.IsShifted)
		}
		
		time.Sleep(1 * time.Hour) // Sync every hour
	}
}