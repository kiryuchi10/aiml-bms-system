# AI/ML BMS System — Design

## 1. Architecture

```
[ CAN / Simulator / NASA MAT ]  →  [ Ingestion Pipeline ]  →  [ DB: Raw → Feature → Metric ]
                                                                        ↓
[ WebSocket Stream ]  ←  [ BMS Core Engine ]  ←  [ API / WS Gateway ]  →  [ React Frontend ]
       (replay/DB)         SOC/SOH/Alarm/Balance              REST + WS       Shell + Dashboard
```

- **Backend:** FastAPI, SQLAlchemy, Alembic, optional Celery/Redis.
- **Frontend:** React (Vite + TS), React Router, state (Zustand/Context), dashboard UI patterns.
- **Data:** backend/data (MAT/Parquet) → pipelines → DB → API → Frontend. Time-series append-only.

## 2. Data Model

- **Raw:** telemetry_pack, telemetry_module, telemetry_cell (append-only).
- **Feature:** feature_cell (engineered windows).
- **Metric:** metric_aging (cycle/health summaries).
- **Events:** balancing_event, alarm_event.
- **ML:** ml_run, ml_metric.

See `db/DB_SCHEMA_POSTGRES.sql` and `db/DB_SCHEMA_MYSQL.sql`.

## 3. API (High-Level)

- **Auth:** POST /auth/login, GET /auth/me.
- **Dashboard:** GET /api/v1/dashboard/overview, /dashboard/cell-grid, /dashboard/active-alarms.
- **Cells:** GET /api/v1/cells/latest?vehicle_id=, GET /api/v1/cells/timeseries?cell_id=&signal=&start=&end=.
- **Plot:** GET /api/v1/plot/pack?vehicle_id=&metric=&window=.
- **Balance:** POST /api/v1/balance/set.
- **WebSocket:** /ws/bms (control: start/stop; stream: telemetry pack + cells + alarms).
- **ML:** /api/v1/ml/datasets, /ml/train, /ml/runs, /ml/runs/{id}.

## 4. Frontend Shell Layout

- **TopBar (48–56px):** Title, Vehicle selector (opt), Connection pill, Start/Stop, Config, User menu.
- **SideNav (88–120px):** Dashboard Home, Cells Grid, Realtime, Analytics, Alarm Center, ML Console, Config, etc.
- **Main:** Scrollable; 12-column grid for Dashboard Home; cards + numbers + colors + icons; status colors (normal/warn/fault) unified.

## 5. Dashboard Home Layout (inside Main)

- **Row 1 (col-12):** PackSummaryBar or PackOverviewTiles.
- **Row 2:** Left (col-8): PackOverviewTiles, SocGaugeCard, WorstCellCard. Right (col-4): ActiveAlarmsMiniTable, then LearningsCard + AlarmsGridCard stacked.
- **Row 3 (col-12):** CellTable (click row → /cells + cellId).

## 6. Data Flow

- Ingest: NASA MAT / Parquet → parse → upsert raw tables (idempotent).
- Features: raw → window/stride → feature_cell.
- Metrics: feature/raw → metric_aging.
- Alarms: rule engine (thresholds) → alarm_event.
- Dashboard: services query DB → thin routers → frontend.
