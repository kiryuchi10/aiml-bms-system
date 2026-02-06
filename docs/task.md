# AI/ML BMS System — Task Checklist

Execution order: Phase 0 → 1 → 2 → 3 → 4. Schema → service → router order.

---

## Phase 0 — Scaffold

- [ ] DB schema SQL (Postgres / MySQL) in `db/`
- [ ] SQLAlchemy models + Alembic migration
- [ ] Basic FastAPI app + router mount + CORS + logging
- [ ] Frontend: Shell (TopBar, SideNav, Main), 12-col grid, status colors

## Phase 1 — Ingestion

- [ ] parse_mat pipeline (B0005, B0006, B0007, B0018) from backend/data
- [ ] Create pack/module/cell registry (e.g. virtual-pack 20 cells)
- [ ] Write telemetry_cell (and pack/module) rows; append-only, idempotent

## Phase 2 — Dashboard APIs

- [ ] GET /api/v1/dashboard/overview (pack summary, worst cell, alarms)
- [ ] GET /api/v1/dashboard/cell-grid
- [ ] GET /api/v1/telemetry/cell/{id} (or cells/timeseries)
- [ ] Alarms rule engine + GET /api/v1/alarms (or dashboard/active-alarms)

## Phase 3 — WebSocket

- [ ] WS /ws/bms stream pack + cells snapshot (replay from DB or MAT/parquet)
- [ ] Frontend: sliding window charts; Start/Stop control; data stale indicator

## Phase 4 — Analytics + ML

- [ ] Build feature_cell batch from raw
- [ ] metric_aging compute
- [ ] ML dataset list + async train + run metrics; comparison table (mean±std)

---

## Dashboard Home (Component Tasks)

- [ ] PackSummaryBar / PackOverviewTiles (6 tiles: V, I, SOC, Pack Temp, Ambient, ΔV/worst cell)
- [ ] SocGaugeCard (circular gauge, usable SOC, remaining/to-full proxy)
- [ ] WorstCellCard (min/max V, max temp)
- [ ] ActiveAlarmsMiniTable (recent N, severity colors)
- [ ] CellTable (columns: Cell, V, T, I, SOC, SoH, Discharge Est, Charge Est); row click → /cells
- [ ] LearningsCard (calibration / learned params)
- [ ] AlarmsGridCard (4×4 or 2col; active/latched; click → Alarm Center with filter)

---

## Definition of Done (MVP)

- [ ] NASA MAT ingest runs; dashboard shows pack + cells (no “No pack data” when data present).
- [ ] Dashboard Home layout matches REQUIREMENTS (Shell + 12-col + components).
- [ ] Realtime Monitor: WS connects; charts show Pack V, I, SOC, Temp (mock or from DB).
- [ ] Analytics: SOC/SOH trend + thermal/aging endpoints return data or stub.
- [ ] RBAC + JWT: login → token → API calls; roles (admin/operator/engineer/ml) for page/action.
