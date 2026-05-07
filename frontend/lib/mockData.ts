// ─── Forecast Data ──────────────────────────────────────────────────────────
export interface ForecastPoint {
  timestamp: string;
  predicted_load: number;
  optimized_load: number;
  is_shifted: boolean;
}

export interface Recommendation {
  zone_id: string;
  zone_name: string;
  synergy_score: number;
  reasoning: string;
  solar_ready: boolean;
  ev_density: number;        // vehicles per km²
  grid_headroom: number;     // MW available
  solar_hosting: number;     // MW potential
  land_type: "Commercial" | "Industrial" | "Mixed" | "Residential";
  coordinates: [number, number]; // [lat, lng]
}

export interface Directive {
  id: string;
  severity: "ACTION_REQUIRED" | "ADVISORY" | "NOMINAL";
  zone: string;
  message: string;
  timestamp: string;
}

export interface SystemLog {
  id: string;
  timestamp: string;
  level: "INFO" | "WARN" | "ERROR";
  source: string;
  message: string;
}

// ─── Generate realistic time-series forecast data ────────────────────────────
function generateForecastSeries(zone: string): ForecastPoint[] {
  const baseLoads: Record<string, number> = {
    Koramangala: 85,
    Whitefield: 110,
    "Electronic City": 130,
    Indiranagar: 70,
    Hebbal: 60,
    Marathahalli: 95,
  };
  const base = baseLoads[zone] || 80;
  const now = new Date("2026-05-07T00:00:00");
  const points: ForecastPoint[] = [];

  for (let i = 0; i < 48; i++) {
    const t = new Date(now.getTime() + i * 30 * 60 * 1000);
    const hour = t.getHours() + t.getMinutes() / 60;

    // Morning ramp 6–9am, lunch dip, evening peak 17–21, night taper
    let factor = 0.45;
    if (hour >= 6 && hour < 9) factor = 0.45 + ((hour - 6) / 3) * 0.4;
    else if (hour >= 9 && hour < 12) factor = 0.82;
    else if (hour >= 12 && hour < 14) factor = 0.75;
    else if (hour >= 14 && hour < 17) factor = 0.80;
    else if (hour >= 17 && hour < 20) factor = 1.0; // peak
    else if (hour >= 20 && hour < 22) factor = 0.85;
    else if (hour >= 22) factor = 0.55;

    const noise = (Math.random() - 0.5) * 0.06;
    const predicted = parseFloat((base * (factor + noise)).toFixed(2));

    // Water-filling: shift ~18–22% off peak hours (17–21) to off-peak (2–6am)
    const isPeak = hour >= 17 && hour < 21;
    const isOffPeak = hour >= 2 && hour < 6;
    const shiftFactor = isPeak ? 0.78 : isOffPeak ? 1.22 : 1.0;
    const optimized = parseFloat((predicted * shiftFactor).toFixed(2));

    points.push({
      timestamp: t.toISOString(),
      predicted_load: predicted,
      optimized_load: Math.min(optimized, predicted * 1.3),
      is_shifted: isPeak || isOffPeak,
    });
  }
  return points;
}

export const MOCK_FORECASTS: Record<string, ForecastPoint[]> = {
  Koramangala: generateForecastSeries("Koramangala"),
  Whitefield: generateForecastSeries("Whitefield"),
  "Electronic City": generateForecastSeries("Electronic City"),
  Indiranagar: generateForecastSeries("Indiranagar"),
  Hebbal: generateForecastSeries("Hebbal"),
  Marathahalli: generateForecastSeries("Marathahalli"),
};

// ─── Recommendations ─────────────────────────────────────────────────────────
export const MOCK_RECOMMENDATIONS: Recommendation[] = [
  {
    zone_id: "WF-01",
    zone_name: "Whitefield Tech Corridor",
    synergy_score: 94,
    reasoning:
      "Extreme EV density from IT campuses (Prestige Tech Park, ITPB) with significant grid headroom post-2025 substation upgrade. South-facing rooftops averaging 850 kWh/kWp/year. BBMP Master Plan designates area as Mobility Hub Zone.",
    solar_ready: true,
    ev_density: 312,
    grid_headroom: 48.5,
    solar_hosting: 22.3,
    land_type: "Commercial",
    coordinates: [12.9698, 77.7499],
  },
  {
    zone_id: "EC-01",
    zone_name: "Electronic City Phase 2",
    synergy_score: 91,
    reasoning:
      "Industrial anchor tenants with predictable 7am–6pm charging demand. 38 MW of planned solar from BESCOM's 2026 rooftop incentive scheme. Road widening project provides land for 3 new fast-charge hubs.",
    solar_ready: true,
    ev_density: 287,
    grid_headroom: 61.2,
    solar_hosting: 38.0,
    land_type: "Industrial",
    coordinates: [12.8399, 77.6770],
  },
  {
    zone_id: "KOR-02",
    zone_name: "Koramangala Startup Hub",
    synergy_score: 88,
    reasoning:
      "Highest peak-to-off-peak EV charging ratio in Bengaluru. Water-filling algorithm can flatten 22% of the evening peak. Mixed-use zoning allows interleaved commercial and residential charging.",
    solar_ready: false,
    ev_density: 445,
    grid_headroom: 28.7,
    solar_hosting: 9.5,
    land_type: "Mixed",
    coordinates: [12.9352, 77.6245],
  },
  {
    zone_id: "HEB-01",
    zone_name: "Hebbal Northern Gateway",
    synergy_score: 82,
    reasoning:
      "Upcoming Namma Metro Phase 3 interchange drives projected 3× EV growth by 2027. KPTCL 220kV substation upgrade provides 55 MW buffer. Large open parcels available under industrial land-use.",
    solar_ready: true,
    ev_density: 198,
    grid_headroom: 55.0,
    solar_hosting: 18.6,
    land_type: "Industrial",
    coordinates: [13.0358, 77.5970],
  },
  {
    zone_id: "MAR-01",
    zone_name: "Marathahalli Corridor",
    synergy_score: 79,
    reasoning:
      "Dense residential + commercial mix with rising middle-class EV adoption. Near Outer Ring Road providing supply chain logistics hub potential. 12 MW of solar headroom under BESCOM net-metering.",
    solar_ready: false,
    ev_density: 334,
    grid_headroom: 22.1,
    solar_hosting: 12.0,
    land_type: "Mixed",
    coordinates: [12.9591, 77.6974],
  },
  {
    zone_id: "IND-01",
    zone_name: "Indiranagar Transit Node",
    synergy_score: 74,
    reasoning:
      "Metro Line connectivity enables park-and-charge use case. Lower industrial base limits grid headroom but high retail density ensures utilization >85%. Solar retrofit viable on commercial malls.",
    solar_ready: true,
    ev_density: 276,
    grid_headroom: 15.8,
    solar_hosting: 7.2,
    land_type: "Commercial",
    coordinates: [12.9784, 77.6408],
  },
  {
    zone_id: "YES-01",
    zone_name: "Yeshwanthpur Industrial",
    synergy_score: 71,
    reasoning:
      "Logistics fleet electrification opportunity. Night-time off-peak charging ideal for water-filling dispatch. Requires substation upgrade for >20 MW capacity expansion.",
    solar_ready: false,
    ev_density: 156,
    grid_headroom: 19.3,
    solar_hosting: 5.5,
    land_type: "Industrial",
    coordinates: [13.0232, 77.5561],
  },
  {
    zone_id: "BTM-01",
    zone_name: "BTM Layout Residential",
    synergy_score: 66,
    reasoning:
      "High residential EV adoption but constrained 11kV network. Demand response program can shift 15% of load. Neighbourhood EV charging pods recommended over fast-charge infrastructure.",
    solar_ready: false,
    ev_density: 389,
    grid_headroom: 10.2,
    solar_hosting: 4.1,
    land_type: "Residential",
    coordinates: [12.9165, 77.6101],
  },
];

// ─── Directives ──────────────────────────────────────────────────────────────
export const MOCK_DIRECTIVES: Record<string, Directive[]> = {
  Koramangala: [
    {
      id: "DIR-001",
      severity: "ACTION_REQUIRED",
      zone: "Koramangala",
      message:
        "ACTION REQUIRED: Throttle Koramangala Station 4 by 25.6% — grid load forecast exceeds N-1 contingency threshold at 18:30.",
      timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
    },
    {
      id: "DIR-002",
      severity: "ADVISORY",
      zone: "Koramangala",
      message:
        "ADVISORY: Activate demand-response contract for Koramangala Tech Park cluster — estimated 4.2 MW deferrable over 2h window.",
      timestamp: new Date(Date.now() - 12 * 60000).toISOString(),
    },
    {
      id: "DIR-003",
      severity: "NOMINAL",
      zone: "Koramangala",
      message:
        "NOMINAL: Water-filling optimization active — 18.3% peak reduction achieved vs baseline. Ahead of daily target.",
      timestamp: new Date(Date.now() - 28 * 60000).toISOString(),
    },
  ],
  Whitefield: [
    {
      id: "DIR-004",
      severity: "ACTION_REQUIRED",
      zone: "Whitefield",
      message:
        "ACTION REQUIRED: Whitefield ITPB feeder under stress — recommend staggering EV charging at Prestige Tech Park by +45 minutes.",
      timestamp: new Date(Date.now() - 3 * 60000).toISOString(),
    },
    {
      id: "DIR-005",
      severity: "ADVISORY",
      zone: "Whitefield",
      message:
        "ADVISORY: Solar generation at 94% of forecast. Consider advancing 3 MW scheduled charge to 14:00–15:30 window.",
      timestamp: new Date(Date.now() - 18 * 60000).toISOString(),
    },
    {
      id: "DIR-006",
      severity: "NOMINAL",
      zone: "Whitefield",
      message:
        "NOMINAL: All 12 Whitefield EV stations reporting healthy OCPP heartbeats. Grid frequency stable at 49.97 Hz.",
      timestamp: new Date(Date.now() - 45 * 60000).toISOString(),
    },
  ],
  "Electronic City": [
    {
      id: "DIR-007",
      severity: "ADVISORY",
      zone: "Electronic City",
      message:
        "ADVISORY: Phase-2 sub-transmission line scheduled maintenance at 23:00 — reroute EV charging through Phase-1 feeder.",
      timestamp: new Date(Date.now() - 8 * 60000).toISOString(),
    },
    {
      id: "DIR-008",
      severity: "NOMINAL",
      zone: "Electronic City",
      message:
        "NOMINAL: Industrial anchor load stable. EV charging optimization delivering 21.4% cost saving vs flat-tariff baseline.",
      timestamp: new Date(Date.now() - 35 * 60000).toISOString(),
    },
  ],
  Indiranagar: [
    {
      id: "DIR-009",
      severity: "NOMINAL",
      zone: "Indiranagar",
      message:
        "NOMINAL: Metro-adjacent charging utilization at 73%. Evening ramp within predicted bounds.",
      timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
    },
    {
      id: "DIR-010",
      severity: "ADVISORY",
      zone: "Indiranagar",
      message:
        "ADVISORY: Weekend demand pattern detected — reduce peak-hour charging cap from 150 kW to 100 kW across retail nodes.",
      timestamp: new Date(Date.now() - 40 * 60000).toISOString(),
    },
  ],
  Hebbal: [
    {
      id: "DIR-011",
      severity: "NOMINAL",
      zone: "Hebbal",
      message:
        "NOMINAL: New substation online — grid headroom increased to 55 MW. EV expansion capacity confirmed for 2026 targets.",
      timestamp: new Date(Date.now() - 10 * 60000).toISOString(),
    },
  ],
  Marathahalli: [
    {
      id: "DIR-012",
      severity: "ACTION_REQUIRED",
      zone: "Marathahalli",
      message:
        "ACTION REQUIRED: Voltage sag detected on ORR feeder — reduce charging rate at Marathahalli Hub 2 by 30% immediately.",
      timestamp: new Date(Date.now() - 2 * 60000).toISOString(),
    },
    {
      id: "DIR-013",
      severity: "ADVISORY",
      zone: "Marathahalli",
      message:
        "ADVISORY: Logistics fleet charging window optimal from 01:00–04:30. Notify fleet operators to pre-schedule.",
      timestamp: new Date(Date.now() - 22 * 60000).toISOString(),
    },
  ],
};

// ─── System Logs ─────────────────────────────────────────────────────────────
export const MOCK_LOGS: SystemLog[] = [
  { id: "LOG-001", timestamp: new Date(Date.now() - 1 * 60000).toISOString(), level: "INFO", source: "water-fill-engine", message: "Optimization cycle complete. Peak shift: 18.3%. Energy stored: 4.2 MWh." },
  { id: "LOG-002", timestamp: new Date(Date.now() - 3 * 60000).toISOString(), level: "WARN", source: "grid-monitor", message: "Koramangala Zone 4 feeder load at 87% capacity — approaching N-1 threshold." },
  { id: "LOG-003", timestamp: new Date(Date.now() - 5 * 60000).toISOString(), level: "ERROR", source: "ocpp-gateway", message: "Station KOR-S04-C12 heartbeat timeout (180s). Attempting reconnect..." },
  { id: "LOG-004", timestamp: new Date(Date.now() - 7 * 60000).toISOString(), level: "INFO", source: "prophet-ai", message: "24h forecast model refreshed. MAPE: 3.2%. Confidence interval: ±5.1 MW." },
  { id: "LOG-005", timestamp: new Date(Date.now() - 9 * 60000).toISOString(), level: "INFO", source: "kafka-consumer", message: "Consumed 14,320 EV telemetry events in last 5 min. Lag: 0 messages." },
  { id: "LOG-006", timestamp: new Date(Date.now() - 12 * 60000).toISOString(), level: "WARN", source: "solar-integrator", message: "Whitefield solar generation 12% below forecast (cloud cover event). Adjusting dispatch." },
  { id: "LOG-007", timestamp: new Date(Date.now() - 15 * 60000).toISOString(), level: "INFO", source: "scheduler", message: "Demand-response contract activated: Koramangala Tech Park — 4.2 MW for 2h." },
  { id: "LOG-008", timestamp: new Date(Date.now() - 20 * 60000).toISOString(), level: "INFO", source: "db-writer", message: "grid_forecasts table: 1,440 rows inserted. TimescaleDB compression ratio: 8.2x." },
  { id: "LOG-009", timestamp: new Date(Date.now() - 25 * 60000).toISOString(), level: "ERROR", source: "bescom-scada", message: "SCADA data feed latency spike: 4,200ms (expected <500ms). Failover to cached telemetry." },
  { id: "LOG-010", timestamp: new Date(Date.now() - 30 * 60000).toISOString(), level: "INFO", source: "infra-planner", message: "Synergy scores recomputed for 8 zones. Top candidate: Whitefield (94/100)." },
  { id: "LOG-011", timestamp: new Date(Date.now() - 35 * 60000).toISOString(), level: "INFO", source: "water-fill-engine", message: "Off-peak charging window dispatched: 02:00–05:30 across Hebbal and Yeshwanthpur feeders." },
  { id: "LOG-012", timestamp: new Date(Date.now() - 40 * 60000).toISOString(), level: "WARN", source: "ocpp-gateway", message: "Station MAR-S02-C08 reporting overcurrent fault. Auto-throttle engaged at 80% capacity." },
  { id: "LOG-013", timestamp: new Date(Date.now() - 50 * 60000).toISOString(), level: "INFO", source: "prophet-ai", message: "Model retrain triggered: 7-day rolling accuracy below 95% threshold. ETA: 4 min." },
  { id: "LOG-014", timestamp: new Date(Date.now() - 60 * 60000).toISOString(), level: "INFO", source: "kafka-producer", message: "Published 320 grid-event messages to bescom.grid.telemetry topic. Partition balance: OK." },
  { id: "LOG-015", timestamp: new Date(Date.now() - 75 * 60000).toISOString(), level: "ERROR", source: "db-writer", message: "Connection pool exhausted (20/20). Query queued. Latency impact: ~180ms." },
];

// ─── KPI Mock Data ────────────────────────────────────────────────────────────
export const MOCK_KPIS = {
  gridStabilityIndex: 94.7,
  gridStabilityTrend: +1.2,
  peakReductionPct: 18.3,
  peakReductionTrend: +2.5,
  solarUtilizationPct: 76.4,
  solarUtilizationTrend: -3.1,
  criticalZones: 2,
  criticalZonesList: ["Koramangala Zone 4", "Marathahalli Hub 2"],
};
