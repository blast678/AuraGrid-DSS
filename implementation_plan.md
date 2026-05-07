# AuraGrid Dashboard — Implementation Plan

## Overview

Build a production-ready, enterprise-grade Next.js 14 App Router dashboard for **AuraGrid**, BESCOM's Decision-Support Layer for managing EV charging demand in Bengaluru. The frontend will live in `c:\Projects\AuraGrid\frontend\` and connect to a GoLang backend at `http://localhost:8080`.

---

## User Review Required

> [!WARNING]
> **Port Conflict Detected**: The existing `docker-compose.yml` maps `kafka-ui` to **port 8080** — the same port you specified for the GoLang backend. When both are running, only one can use that port.
>
> **Resolution Options:**
> 1. ✅ **Recommended**: I'll configure the frontend to hit `http://localhost:8081` for the Go API (change the Go server's listen port in `core-api/cmd/main.go`).
> 2. Or we can keep `8080` and assume the Kafka-UI docker service will be disabled when running the core-api.
>
> Please confirm. I'll **default to option 2** (keep `8080`, assume Kafka-UI is stopped) since it matches your original spec.

> [!IMPORTANT]
> The frontend will display **realistic mock data** when the Go backend is offline. React Query will gracefully fall back to static seed data so the UI is always fully functional for demos — no backend required to evaluate the UI.

---

## Open Questions

> [!NOTE]
> **Bengaluru Substation Toggle**: You specified a toggle between "different Bengaluru Sub-stations." I'll seed **6 substations** (Koramangala, Whitefield, Electronic City, Indiranagar, Hebbal, Marathahalli) based on real BESCOM zone names. Let me know if you need specific ones.

> [!NOTE]
> **Map Library**: Leaflet with `react-leaflet` and Bengaluru GeoJSON boundaries will be used (no Mapbox token required). If you prefer `react-map-gl` (requires a Mapbox token), please specify.

---

## Proposed Changes

### 1. Project Scaffolding

#### [NEW] `frontend/` — Next.js 14 App Router project

Scaffolded with:
- `npx create-next-app@latest` with TypeScript, Tailwind CSS, App Router, ESLint
- Shadcn UI initialized and components added
- Dependencies: `recharts`, `react-leaflet`, `leaflet`, `@tanstack/react-query`, `lucide-react`, `axios`

---

### 2. Design System & Global Styles

#### [NEW] `frontend/src/app/globals.css`
- CSS custom properties for **BESCOM Blue** (`#1A3A6B`), **Grid Green** (`#22C55E`), warning amber
- Inter font from Google Fonts
- Base Tailwind layers with enterprise-grade card/shadow tokens

---

### 3. Application Shell

#### [NEW] `frontend/src/app/layout.tsx`
- Root layout with React Query Provider, global font, and metadata

#### [NEW] `frontend/src/components/layout/Sidebar.tsx`
- Desktop: fixed left sidebar with logo + nav links (Grid Monitor, Infrastructure Planner, System Logs)
- Mobile: bottom navigation bar
- Active route highlighting with Lucide icons (`Activity`, `Map`, `FileText`)

#### [NEW] `frontend/src/components/layout/AppShell.tsx`
- Wraps `{children}` with the sidebar + main content area

---

### 4. Dashboard Overview Page

#### [NEW] `frontend/src/app/page.tsx` → `/` (redirects to `/dashboard`)

#### [NEW] `frontend/src/app/dashboard/page.tsx`
- **4 KPI Cards** using Shadcn `Card`:
  - Grid Stability Index (with animated gauge or progress ring)
  - Peak Reduction % Last 24h (with trend arrow)
  - Solar Utilization % (with sparkline mini-chart)
  - Critical Zones Count (with badge alert)
- Quick-access tiles to Grid Monitor and Infrastructure Planner

---

### 5. Part A — Grid Monitor

#### [NEW] `frontend/src/app/dashboard/grid-monitor/page.tsx`
- **Substation Toggle**: Shadcn `Tabs` with 6 Bengaluru zones
- **Interactive Line Chart** (Recharts `ComposedChart`):
  - Two lines: "Baseline Predicted Load" (dashed blue) vs "AuraGrid Optimized Load" (solid green)
  - Shaded area between the two lines showing energy shifted/saved
  - Custom tooltip with timestamps and delta values
  - `is_shifted` data points highlighted as dots on the optimized line
  - Data fetched from `GET /api/forecast?zone=<substation>` via React Query
- **Directives Panel**: Shadcn `Alert` styled cards showing human-readable action strings
  - Color-coded: `ACTION REQUIRED` (red), `ADVISORY` (amber), `NOMINAL` (green)
  - Live-refresh every 30s

#### [NEW] `frontend/src/hooks/useForecast.ts`
- React Query hook for `GET /api/forecast`
- Mock fallback data for offline demo

#### [NEW] `frontend/src/hooks/useDirectives.ts`
- React Query hook for `GET /api/directives`
- Generates human-readable directive strings

---

### 6. Part B — Infrastructure Planner

#### [NEW] `frontend/src/app/dashboard/infrastructure/page.tsx`
- **Bengaluru Map** (react-leaflet):
  - Custom GeoJSON boundaries for Bengaluru zones
  - Choropleth/heatmap overlay colored by `synergy_score` (green → amber → red)
  - Click-to-inspect zone popup with score breakdown
- **Top 5 Recommended Sites** list:
  - Shadcn `Table` with columns: Zone, EV Density, Grid Headroom, Solar Hosting Capacity, Land Type, Synergy Score
  - Each row has an `expand` control showing `reasoning` text
  - `solar_ready` shown as a Shadcn `Badge`
- **Action Buttons**:
  - "Generate ROI Report" → triggers a client-side PDF/export modal
  - "Export for BBMP Approval" → downloads a CSV/JSON artifact

#### [NEW] `frontend/src/hooks/useRecommendations.ts`
- React Query hook for `GET /api/recommendations`
- Mock fallback with 8 zones

#### [NEW] `frontend/src/data/bengaluru-zones.geojson`
- Simplified GeoJSON boundaries for ~12 Bengaluru planning zones

---

### 7. System Logs Page

#### [NEW] `frontend/src/app/dashboard/system-logs/page.tsx`
- Auto-scrolling log feed (simulated real-time)
- Filter by severity: INFO, WARN, ERROR
- Shadcn `Table` with monospace timestamps

---

### 8. Shared Components

#### [NEW] `frontend/src/components/ui/` — Shadcn generated components
- `Card`, `Table`, `Badge`, `Button`, `Tabs`, `Alert`

#### [NEW] `frontend/src/components/kpi/KpiCard.tsx`
- Reusable KPI card with icon, value, delta, sparkline slot

#### [NEW] `frontend/src/components/charts/LoadForecastChart.tsx`
- Recharts wrapper for the Grid Monitor line chart

#### [NEW] `frontend/src/components/map/BengaluruMap.tsx`
- Leaflet map with GeoJSON and synergy-score choropleth

#### [NEW] `frontend/src/components/directives/DirectivesPanel.tsx`
- Scrollable panel of directive alerts

---

### 9. API Layer

#### [NEW] `frontend/src/lib/api.ts`
- Axios instance pointing to `http://localhost:8080`
- Interceptors for error handling and auth headers

#### [NEW] `frontend/src/lib/mockData.ts`
- Complete mock datasets for all endpoints (for offline demo)

---

## File Structure (Final)

```
frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx                    # Root layout + providers
│   │   ├── page.tsx                      # Redirect to /dashboard
│   │   ├── globals.css                   # Design tokens + Tailwind base
│   │   └── dashboard/
│   │       ├── page.tsx                  # Overview KPI page
│   │       ├── grid-monitor/page.tsx     # Part A: Grid Monitor
│   │       ├── infrastructure/page.tsx   # Part B: Infrastructure Planner
│   │       └── system-logs/page.tsx      # System Logs
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   └── AppShell.tsx
│   │   ├── kpi/KpiCard.tsx
│   │   ├── charts/LoadForecastChart.tsx
│   │   ├── map/BengaluruMap.tsx
│   │   └── directives/DirectivesPanel.tsx
│   ├── hooks/
│   │   ├── useForecast.ts
│   │   ├── useDirectives.ts
│   │   └── useRecommendations.ts
│   ├── lib/
│   │   ├── api.ts
│   │   └── mockData.ts
│   └── data/
│       └── bengaluru-zones.geojson
├── public/
├── package.json
├── next.config.js
├── tailwind.config.ts
└── tsconfig.json
```

---

## Verification Plan

### Automated
- `npm run build` — verify zero TypeScript/build errors
- `npm run dev` — confirm dev server starts on port 3000

### Browser Testing
- Load `/dashboard` → verify 4 KPI cards render with data
- Navigate to Grid Monitor → verify Recharts line chart renders with both lines, substation toggle works
- Navigate to Infrastructure → verify Leaflet map loads, heatmap renders, Top 5 table populates
- Test mobile breakpoint → verify bottom navigation appears

### Manual Verification
- Confirm mock data fallback works without backend running
- Confirm the chart tooltip shows correct delta values
- Confirm "Export for BBMP Approval" downloads a file
