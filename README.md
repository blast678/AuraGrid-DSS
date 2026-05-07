# ⚡ AuraGrid-DSS: Autonomous Grid Orchestration & Spatial Planning

![AuraGrid-DSS Banner](https://via.placeholder.com/1200x300.png?text=AuraGrid-DSS+Decision+Support+System)

**AuraGrid-DSS** is a high-concurrency Decision-Support System designed specifically for **BESCOM** to mitigate grid stress caused by rapid EV adoption in Bengaluru. It operates as an active intelligence layer that predicts demand spikes, dynamically rebalances loads, and identifies high-ROI infrastructure sites using multi-factor synergy scoring.

---

## 🎯 The Problem & Our Solution

Bengaluru's EV adoption is creating concentrated "hotspots" of demand. Without intervention, evening charging spikes (18:00–21:00) threaten to exceed transformer N-1 thresholds. 

AuraGrid-DSS solves this through a Dual-Engine Intelligence Layer:

### Part A: The Grid Governor (Load Orchestration)
* **Prophet AI Forecasting:** Predicts 48-hour rolling demand across Bengaluru substations.
* **Water-Filling Algorithm:** When forecasts predict a breach of the safety limit (e.g., 60.0kWh), our Go-based scheduler automatically "shaves" the peak and redistributes it to off-peak valleys (02:00–06:00).
* **Actionable Directives:** Generates plain-English operator commands (e.g., *"Throttle Station 4 by 25.6%"*).

### Part B: The Spatial Optimizer (Infrastructure Planning)
* **Synergy Scoring:** Analyzes 9,500+ geographic zones based on EV Density (Demand), Grid Headroom (Safety), and Solar Hosting Potential.
* **Repulsion Logic:** Penalizes redundant placements near existing infrastructure to ensure maximum urban coverage.
* **Visual Explainability:** Interactive Bengaluru heatmap coloring zones by ROI viability (Green = High Synergy, Red = Grid Constrained).

---

## 🏗️ System Architecture

AuraGrid-DSS is built using a modern, decoupled microservice architecture to ensure high concurrency and fault tolerance.

* **Client Layer:** Next.js 14, Tailwind CSS, Shadcn UI, Recharts, React-Leaflet
* **Core API (The Muscle):** GoLang (handles Water-Filling logic & Synergy Math)
* **AI Engine (The Brain):** Python, FastAPI, Prophet (Time-series ML)
* **Event Streaming (The Nervous System):** Apache Kafka (Buffers 18,000+ telemetry events)
* **Persistence Layer:** PostgreSQL / TimescaleDB

---

## 🚀 Quickstart: How to Run Locally

Follow these steps strictly in order to initialize the environment, synchronize the data pipeline, and launch the dashboard.

### Prerequisites
* Docker & Docker Compose
* Go 1.21+
* Python 3.9+
* Node.js 18+

### 1. Infrastructure (PostgreSQL & Kafka)
Start the database and event streaming cluster.
```bash
docker-compose up -d
```
*(Verify ports 5433, 9092, and 9000 are active)*

### 2. AI Engine (Prophet Forecasting)
Initialize the Python environment and start the ML API.
```bash
cd ai-engine
python -m venv venv

# Windows: .\venv\Scripts\activate
# Mac/Linux: source venv/bin/activate

pip install -r requirements.txt
python -c "import cmdstanpy; cmdstanpy.install_cmdstan()"
python scripts/preprocess.py  # Syncs 18k+ synthetic chargers
python app/main.py
```
*(Runs on http://localhost:8000)*

### 3. Core API (GoLang)
Start the Grid Governor to handle load shifting and spatial math.
```bash
cd core-api
go mod tidy
go run cmd/main.go
```
*(Runs on http://localhost:8080)*

### 4. Client Dashboard (Next.js)
Launch the interactive BESCOM operator interface.
```bash
cd frontend
npm install
npm run dev
```
*(Runs on http://localhost:3000)*

---

## 📂 Project Structure
```text
AuraGrid-DSS/
├── ai-engine/           # Python FastAPI, Prophet ML models, Data generation
├── core-api/            # GoLang backend, Water-Filling algorithm, Kafka consumers
├── frontend/            # Next.js 14 dashboard, Shadcn UI, Interactive Maps
├── docker-compose.yml   # Kafka & TimescaleDB orchestration
└── .gitignore           # Universal ignore rules
```

## 🛡️ Compliance & Non-Negotiables Met
- **Zero Grid Modification**: Operates 100% as a software decision-support layer.
- **Data Sovereignty**: All processing is done via local Python/Go engines. No sensitive grid data is sent to external LLM APIs.
- **Audit-Ready**: Operator directives are logged in the database for compliance tracking.

*Built for the BESCOM Hackathon 2026 by Team ByteCreafted.*

---

## 📝 The Universal `.gitignore`
Copy this block and paste it into a file named exactly `.gitignore` in the root of your project folder so you don't push massive junk files to GitHub.

```text
# --- Environment & Secrets (CRITICAL) ---
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
*.pem
*.key

# --- Next.js / Node ---
node_modules/
.next/
out/
build/
.vercel
.npm
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# --- Go (Backend) ---
# Binaries and packaging
bin/
core-api/core-api
core-api/cmd/main
*.exe
*.exe~
*.dll
*.so
*.dylib
# Dependency directories (only if you use vendor)
vendor/

# --- Python (AI Engine) ---
__pycache__/
*.py[cod]
*$py.class
.venv
venv/
ENV/
.pytest_cache/
.ipynb_checkpoints/

# --- Data & Logs (Preventing Repo Bloat) ---
# We ignore the massive processed files but keep the raw seeds
ai-engine/data/processed_*.csv
ai-engine/data/final_*.csv
ai-engine/data/vahan_ev_adoption_proxy.csv
*.log
docker/volumes/

# --- IDE & OS ---
.vscode/
.idea/
.DS_Store
Thumbs.db