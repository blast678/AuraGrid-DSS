package db

import (
	"context"
	"fmt"
	"log"

	"github.com/jackc/pgx/v5/pgxpool"
)

var Pool *pgxpool.Pool

// Accept dbURL dynamically instead of hardcoding
func InitDB(dbURL string) {
	config, err := pgxpool.ParseConfig(dbURL)
	if err != nil {
		log.Fatalf("❌ Unable to parse database URL: %v", err)
	}

	Pool, err = pgxpool.NewWithConfig(context.Background(), config)
	if err != nil {
		log.Fatalf("❌ Unable to connect to database: %v", err)
	}

	err = Pool.Ping(context.Background())
	if err != nil {
		log.Fatalf("❌ Database ping failed: %v", err)
	}

	fmt.Println("✅ Successfully connected to PostgreSQL pool!")
}

func CloseDB() {
	if Pool != nil {
		Pool.Close()
		fmt.Println("🛑 Database connection pool closed.")
	}
}