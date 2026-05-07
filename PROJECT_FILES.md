# Project Files Summary

This file lists the repository's primary logical files and directories with a one-line explanation for each.

- `README.md`: Project overview, setup instructions and usage notes.
- `.gitignore`: Patterns for files and directories to exclude from version control.
- `docker-compose.yml`: Docker Compose configuration to run services locally.

- `ai-engine/requirements.txt`: Python package dependencies for the AI engine.
- `ai-engine/app/main.py`: Entry point for the AI engine application (server or runner).
- `ai-engine/data/`: Directory for input/output data used by the AI engine.
- `ai-engine/models/prophet_model.json`: Persisted Prophet forecasting model used by the AI engine.

- `core-api/go.mod`: Go module file defining module path and dependency versions.
- `core-api/go.sum`: Checksums for Go module dependencies.
- `core-api/cmd/main.go`: Main program that starts the core API server.
- `core-api/internal/db/db.go`: Database connection and query utilities for the core API.
- `core-api/internal/kafka/producer.go`: Kafka producer implementation used to publish events.
- `core-api/internal/scheduler/`: Scheduler implementation and cron/job handlers for background tasks.

- `frontend/`: Frontend application source (UI code, assets and build config).

Notes:

- The `ai-engine/venv/` directory and other virtual environment or third-party package folders are intentionally excluded from this summary because they are environment artifacts, not source files.
The AuraGrid Master Architecture
Here is the full context of what every piece of code is doing, why it exists, and where it lives.

1. The Infrastructure Layer (Docker)
File: docker-compose.yml

What: The isolated "Data Center" running on your machine.

Why: You need a highly reliable place to store time-series data (TimescaleDB/Postgres) and a shock-absorber for high-volume data streams (Kafka). Installing these directly on Windows causes registry chaos. Docker keeps them in clean, predictable Linux boxes.

When/Where: This is "Always On" in the background. It is the bedrock of the application.

2. The AI Brain (Python + FastAPI)
Files: ai-engine/app/main.py & models/prophet_model.json

What: The Predictive Engine. It takes the mathematical "memory" of 7,400 past charging sessions and exposes it over a web server.

Why: Python is the industry standard for AI. We use the Prophet algorithm because EV charging isn't random; it follows human daily and weekly routines (seasonality).

When/Where: It runs on your local PC (127.0.0.1:8000). It waits silently until the Go API knocks on its door and asks for the future.

3. The Core API (GoLang)
GoLang is the general commanding the troops. It is fast, compiled, and handles network requests flawlessly.

File: core-api/cmd/main.go

What: The Orchestrator.

Why: It is the entry point that boots up the backend, connects to the database, triggers the AI fetcher, and runs the main loops.

File: core-api/internal/db/db.go

What: The Database Driver.

Why: Establishing a connection to Postgres takes time. This file creates a "Connection Pool" so that when you need to save thousands of rows of data, the pipes are already open and waiting.

File: core-api/internal/ai/fetcher.go

What: The HTTP Client (The Bridge).

Why: Go and Python cannot talk natively. This file sends a network request to port 8000, asks the Python Brain for the 24-hour forecast, and translates the JSON response into Go structs so the system can actually understand the numbers.

⚙️ How the Pipeline Just Worked (The Data Flow)
When you typed go run cmd/main.go, here is the exact sequence of events that happened in milliseconds:

Go woke up and established a secure connection pool to Postgres (Port 5433).

Go yelled over the local network to Python (Port 8000): "Give me the next 24 hours of Koramangala EV demand."

Python looked at its Prophet model in RAM, did the calculus, and handed back a JSON array showing the massive 80.45 kWh peak at 15:00.

Go received the JSON, parsed it, and fired an INSERT INTO SQL command into Postgres.

Postgres safely locked the data into the grid_forecasts table.

Go closed the database pool and successfully exited.