# Frontend (React + Vite)

Dashboard UI: Battery pack information, Fleet overview, Vehicle detail, Trip explorer, Research mode.

## Run

From `aiml-bms-system/frontend`:

```bash
npm install
npm run dev
```

Open http://localhost:5173. API base is configured via `VITE_API_BASE` (default http://localhost:8000); see `.env.example`.

## Build

```bash
npm run build
```

Output in `dist/`. Do not commit `.env` or tokens; use `.env.example` for local config.

## Structure

- `src/routes/index.tsx` — Route table
- `src/pages/Dashboard/` — DashboardHome, FleetOverview, VehicleDetail, TripExplorer, ResearchMode
- `src/components/layout/` — Shell, TopBar, SideBar
- `src/components/bms/` — BatteryPackPanel, CanLinkStatus, CellCard, SignalTile
- `src/components/charts/` — TimeSeriesChart, HistogramChart, ClusterPlot
- `src/services/dashboardApi.ts` — GET /api/v1/dashboard/fleet, /vehicle/{id}, /vehicle/{id}/pack-view
- `src/store/` — authStore, dashboardStore

See project root `README.md` and `docs/SUPPLEMENT_API.md` for API contract.
