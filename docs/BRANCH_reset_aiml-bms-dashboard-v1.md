# Branch: reset/aiml-bms-dashboard-v1

UI/UX and data flow redesign; ML extension base. Same starting point as `main`.

## Backend (FastAPI)

- **API v1** at `/api/v1`:
  - **Telemetry**: `GET /telemetry/pack`, `/telemetry/module/{id}`, `/telemetry/cell/{id}`, `/telemetry/cell/grid`
  - **Dashboard**: `GET /dashboard/overview`, `/dashboard/cell-grid`, `/dashboard/balancing-status`, `/dashboard/alarms`; `POST /dashboard/balancing/set`
  - **Analytics**: `GET /analytics/soc`, `/analytics/soh`, `/analytics/thermal`, `/analytics/risk`
  - **ML**: `POST /ml/train`, `GET /ml/runs`, `GET /ml/run/{id}`, `POST /ml/infer`
  - **WebSocket**: `WS /api/v1/ws/bms` — payload: `{ timestamp, pack, cells, balancing, alarms }`
- **Data**: Real parquet from `backend/data` (no mock). Pack/cell views derived from parquet; balancing state in-memory.
- **Dashboard service**: Builds overview, cell grid (16 cells with noise), alarms (OV/UV/OT/UT/imbalance), balancing status.

## Frontend (React)

- **Dashboard v1** at `/bms/dashboard`:
  - Consumes FastAPI only (no mock).
  - **Cell grid**: Cells from API/WS; click to toggle balancing (POST `/dashboard/balancing/set`).
  - **Balancing status**: Active cell ids, max active, detail.
  - **Alarm panel**: Backend-derived alarms (REST or WS).
  - **Realtime charts**: Voltage, current, SOC from WebSocket (last 60 points).
- **API client**: `src/services/apiV1.ts` — dashboard, balancing, WS URL.
- **Components**: `CellGrid`, `BalancingStatus`, `AlarmPanel`, `RealtimeChart` under `src/components/bms/`.

## How to run

1. Backend: place parquet in `backend/data`, then `uvicorn app.main:app --reload --port 8000`.
2. Frontend: `npm run dev` (proxies `/api` to backend).
3. Open `/bms/dashboard` and use "Dashboard v1" in the left rail.

## Next (e.g. feat/realtime-ws, feat/ml-training)

- Async training, run queue, inference with saved model.
- Dataset selector dropdown, more chart metrics, alarm ack.
