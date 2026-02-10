# Cursor Implementation Guide — AI/ML BMS Suite

Single reference for Cursor: **real data only**, **one canonical layout**, and **copy-paste prompts** for backend (Alarm Router + evidence + IF/AE) and frontend (Realtime / AlarmCenter / ML Console).

---

## 0. Current state

- **DB**: MySQL `aimlbms`. Main schema: `vehicle`, `telemetry_pack`, `telemetry_module`, `telemetry_cell`, `alarm_event`, `ml_run`, `ml_metric`, … (see `db/DB_SCHEMA_MYSQL.sql`).
- **Extended schema** (run after main): `alarm_evidence`, `explanations` — see `db/DB_SCHEMA_MYSQL_EXTENDED.sql`.
- **Backend**: FastAPI, `/api/v1` (dashboard, telemetry, cells, analytics, ml), WebSocket `/ws/bms` (parquet stream) and `/ws/bms/db` (DB replay). Alarms from `alarm_event` via `get_active_alarms_db`; **no** alarm detail/evidence or ACK yet.
- **Frontend**: Dashboard, RealtimeMonitor, AlarmCenter, MLConsole pages; `apiV1.ts` with `vehicle_id` and DB fallback. **No** dedicated alarm list/detail/evidence or real WS shape for `/ws/bms`.

---

## 1. Target architecture (real data only)

- **REST base**: `VITE_API_BASE` → `http://localhost:8000`, prefix `/api/v1`.
- **WebSocket**: `VITE_WS_BASE` (e.g. `ws://localhost:8000`), path **`/ws/bms`**. Message shape: `{ type: "data_update", timestamp, pack: { voltage, current, temperature_avg, soc, mode }, cells: [...], alarms: [...] }`.
- **DB**: `aimlbms`. Passwords/secrets **only in `.env`**; never committed (`.gitignore`).
- **No mock by default**: frontend uses real REST + real WS; backend uses real MySQL and real models (e.g. IF/AE for model_anomaly).

---

## 2. Canonical directory and file layout (no duplication)

Use **one place** per concern; avoid duplicate sql/sh/yml.  
**상세 규칙·실무급 프롬프트**: `docs/CURSOR_PROMPTS_SPEC.md` 참조.

| Concern        | Location |
|----------------|----------|
| MySQL schema   | `db/DB_SCHEMA_MYSQL.sql` (main), `db/DB_SCHEMA_MYSQL_EXTENDED.sql` (alarm_evidence, explanations) |
| DB setup       | `backend/scripts/setup_mysql.sh` (create DB, apply both schemas) |
| Docker         | Repo root `docker-compose.yml` (MySQL + backend + frontend) |
| Backend env    | `backend/.env` (from `backend/.env.example`); never commit `.env` |
| Frontend env   | `frontend/.env` (from `frontend/.env.example`) |
| Ignore rules   | Repo root `.gitignore` + `backend/.gitignore` (env, artifacts, data_lake, *.pkl, etc.) |

**디렉터리 정리 (중복 제거):**
- **SQL**: 동일 테이블을 다른 sql 파일에 중복 정의하지 않는다. 확장만 필요하면 `DB_SCHEMA_MYSQL_EXTENDED.sql` 사용.
- **sh**: DB 셋업은 `setup_mysql.sh` 하나로 통일; 동일 역할의 다른 이름 sh 추가 금지.
- **yml**: 스택은 루트 `docker-compose.yml` 하나; 동일 스택용 `docker-compose.*.mysql.yml` 등은 통합하거나 제거.
- **프롬프트**: Backend “한 방” / Frontend “REAL 연동” 붙여넣기용은 `CURSOR_PROMPTS_SPEC.md`에 정리.

---

## 3. Security and .gitignore

- **Secrets**: MySQL password (e.g. `12345`), JWT secret, API keys — **only in `.env`**. Never hardcode in code; never commit `.env`.
- **.gitignore** (repo root and/or backend) must include:
  - `.env`, `.env.*`, `!.env.example`
  - `artifacts/`, `data_lake/`, `*.pkl`, `*.joblib`, `*.onnx`, `*.parquet`, `node_modules/`, `dist/`

---

## 4. Backend Cursor prompt (one-shot: Alarm Router + evidence + IF/AE)

Paste the block below into Cursor to generate or extend the backend.

```
You are extending the existing FastAPI backend for the AI/ML BMS suite.
Stack: FastAPI + SQLAlchemy + MySQL (DB: aimlbms). Real data only; no mock.

Current state:
- DB has vehicle, telemetry_pack, telemetry_cell, alarm_event, ml_run, ml_metric.
- Extended tables (already in repo): alarm_evidence (alarm_id -> alarm_event.id), explanations (run_id -> ml_run.id, alarm_id -> alarm_event.id). See db/DB_SCHEMA_MYSQL_EXTENDED.sql.
- Existing: app/api/v1/endpoints/dashboard.py (overview, pack-summary, worst-cell, active-alarms from alarm_event), app/services/dashboard_db_service.py (get_active_alarms_db), app/services/alert_service.py (evaluate_cell_alarms), app/api/websocket_bms.py (/ws/bms).

Implement the following without removing existing behavior:

1) Alarm router (full)
- Add router under /api/v1 with prefix /alarms (or include in existing v1 router).
- GET /api/v1/alarms?vehicle_id=1&severity=&alarm_type=&range=1h|6h|24h|7d — list alarm_event rows (with optional filters), return JSON list with id, ts, severity, alarm_type, scope, vehicle_id, module_id, cell_id, value, threshold, rationale, source. Join alarm_evidence: for each alarm include evidence list (reason_type, rule_id, rule_json, model_name, anomaly_score, anomaly_threshold, top_features).
- GET /api/v1/alarms/{alarm_id} — single alarm_event by id + all alarm_evidence rows for that alarm_id. Return alarm + evidence[] + recommended_action[] (derive from alarm_type/severity: e.g. cell_ot -> "Reduce load / check cooling", model_anomaly -> "Check telemetry drift").
- POST /api/v1/alarms/{alarm_id}/ack — (optional) set acknowledged_at = now(), acknowledged_by = null for now. TODO: JWT user id later.

2) Persist evidence when creating alarms
- Whenever the backend creates an alarm_event (e.g. in alert_service or from model anomaly), insert one or more alarm_evidence rows: alarm_id = new alarm_event.id, reason_type = 'rule' or 'model', rule_id/rule_json or model_run_id/model_name/anomaly_score/anomaly_threshold/top_features (JSON). Use existing AlarmEvent model and add an AlarmEvidence model mapped to alarm_evidence table.

3) Model anomaly (IsolationForest + AutoEncoder)
- Add services: feature_builder (pack-level features from recent telemetry: e.g. v_mean, i_mean, t_mean, soc_mean, v_std, …), anomaly_iforest (fit or load from artifact dir; score(x) -> anomaly_score), anomaly_autoencoder (fit or load; score(x) -> recon_error, per_feature_error). Use ARTIFACT_DIR from config; do not commit .pkl/.pt.
- When evaluating alarms (e.g. from WS ingest or a POST /api/v1/alarms/evaluate), run rule-based checks (existing alert_service) and in addition build pack feature vector from latest telemetry, run IF and AE; if score > threshold, create alarm_event (alarm_type='model_anomaly', source='model') and alarm_evidence (reason_type='model', model_name, anomaly_score, anomaly_threshold, top_features from AE per-feature error or IF proxy).

4) WebSocket /ws/bms
- Keep existing /ws/bms behavior. Optionally: when a client sends a data_update message, persist pack/cell telemetry to DB (if not already), run rule + model anomaly, insert alarm_event + alarm_evidence, then broadcast the same message (or enriched with new alarms) to all connected clients. Message shape: { type: "data_update", timestamp, pack: { voltage, current, temperature_avg, soc, mode }, cells: [...], alarms: [...] }.

5) Data ingestion (processed data)
- Add a script or CLI (e.g. under backend/scripts/) that reads parquet from a directory (e.g. data_lake/processed), maps columns to telemetry_pack / telemetry_cell (timestamp, voltage, current, temp, soc, cell_id, etc.), inserts into DB. Create default vehicle/pack if needed. Do not crash on missing files; log warnings.

6) XAI / explanations
- When saving model anomaly evidence, optionally write one row to explanations table: run_id (if from ml_run), alarm_id, method='ae_recon' or 'zscore_proxy', input_snapshot (feature vector summary), output_snapshot (score, threshold), attributions (top_features). GET /api/v1/xai/alarm/{alarm_id} can return explanation rows for that alarm.

Use existing app/db/session.py and app/core/config.py. Add AlarmEvidence and use alarm_evidence table; add explanations table model if not present. Keep all secrets in .env. Return JSON that matches the frontend expectations (alarm list, alarm detail with evidence and recommended_action).
```

---

## 5. Frontend Cursor prompt (real API/WS only, no mock)

Paste the block below into Cursor to refactor/finish the frontend.

```
You are refactoring/finishing the frontend (React + Vite + TS) for the BMS dashboard to work with the REAL backend only. No mock by default.

Constraints:
- REST base: import.meta.env.VITE_API_BASE (e.g. http://localhost:8000)
- WS base: import.meta.env.VITE_WS_BASE (e.g. ws://localhost:8000), path /ws/bms
- All API calls must go through src/services/* (e.g. apiV1.ts or dedicated alarmApi, mlApi). Do not call fetch/axios directly in pages.
- Shared types in src/types/* (telemetry, alarms, ml). Reuse existing types where they exist.

Pages to align with real backend:
1) Home/Dashboard — already uses GET /api/v1/dashboard/overview (with vehicle_id). Keep using real API; ensure overview shows pack, worst-cell, alarm count, and alarms from DB.
2) RealtimeMonitor — connect to WS at VITE_WS_BASE/ws/bms. Use message shape { type: "data_update", timestamp, pack: { voltage, current, temperature_avg, soc, mode }, cells: [...], alarms: [...] }. Update charts and tiles from this. Provide a REST fallback button: GET /api/v1/telemetry/pack/latest (or equivalent) when WS is disconnected.
3) AlarmCenter — use GET /api/v1/alarms?vehicle_id=&severity=&range= for list; GET /api/v1/alarms/{id} for detail (alarm + evidence + recommended_action). Show evidence panel (rule vs model: threshold, model_name, anomaly_score, top_features). Optional: POST /api/v1/alarms/{id}/ack.
4) MLConsole — use GET /api/v1/ml/datasets, POST /api/v1/ml/train, GET /api/v1/ml/runs, GET /api/v1/ml/runs/{run_id}/metrics. Display runs and metrics (loss, predictions, feature importance). No mock data.

Ensure routes exist: /dashboard, /dashboard/realtime, /dashboard/alarms, /dashboard/ml (and cells/analytics as in the app). Use existing Windows-HMI style (e.g. bms.css). Remove any mock-only code paths unless explicitly gated (e.g. VITE_MOCK); default is real backend.
```

---

## 6. Execution workflow (real data)

1. **MySQL**
   - Start MySQL (local or Docker: `docker compose up -d db`).
   - From repo root: `./backend/scripts/setup_mysql.sh` (or from backend: `./scripts/setup_mysql.sh`). Ensures DB `aimlbms` exists and applies main + extended schema.

2. **Backend**
   - `cd backend && cp .env.example .env` (set `DATABASE_URL` or `MYSQL_*` if used). Never commit `.env`.
   - `pip install -r requirements.txt && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000`.

3. **Frontend**
   - `cd frontend && cp .env.example .env` (set `VITE_API_BASE`, `VITE_WS_BASE`). `npm i && npm run dev`.

4. **Data (optional)**
   - Place processed parquet under `data_lake/processed` (or path in backend config). Run ingestion script (see backend prompt) to fill telemetry_pack / telemetry_cell.

5. **WS**
   - RealtimeMonitor connects to `VITE_WS_BASE/ws/bms`. If the backend persists and broadcasts on ingest, sending a data_update (e.g. from a simulator) will update DB and push to the UI.

---

## 7. Cursor rules (short)

- Create files in the specified paths; export default components where appropriate.
- Keep API calls isolated in `src/services/*`; do not call fetch directly in pages.
- Add TODO blocks for backend-dependent parts; use MOCK fallback only when explicitly requested (e.g. `VITE_MOCK=true`); default is real API/WS.

---

## 8. Reference: extended schema (alarm_evidence, explanations)

- **alarm_evidence**: `id`, `alarm_id` (FK alarm_event.id), `reason_type` (rule|model), `description`, `rule_id`, `rule_json`, `model_run_id`, `model_name`, `anomaly_score`, `anomaly_threshold`, `top_features` (JSON), `created_at`.
- **explanations**: `explain_id` (PK), `run_id` (FK ml_run.id), `alarm_id` (FK alarm_event.id), `method`, `input_snapshot`, `output_snapshot`, `attributions` (JSON), `notes`, `created_at`.

Apply after main schema: `mysql aimlbms < db/DB_SCHEMA_MYSQL_EXTENDED.sql` or run `backend/scripts/setup_mysql.sh`.
