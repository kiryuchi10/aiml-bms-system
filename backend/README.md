# Backend (FastAPI)

Base URL: http://localhost:8000  
Prefix: `/api/v1`  
WebSocket: `ws://localhost:8000/api/v1/ws/bms`

## Run (local)

From `aiml-bms-system/backend`:

```bash
python -m venv .venv
.venv\Scripts\activate   # or source .venv/bin/activate
pip install -r requirements.txt
copy .env.example .env   # then set DATABASE_URL and optional JWT_SECRET_KEY
uvicorn app.main:app --reload --port 8000
```

Do not commit `.env` or real `JWT_SECRET_KEY`; use `.env.example` as a template.

## Database

Create DB and run schema once:

```bash
createdb aimlbms
psql -d aimlbms -f database/schema.sql
```

Schema includes: `users`, `vehicles`, `trips`, `charging_sessions`, `telemetry_raw`, `feature_trip`, `metric_aging`, `model_run`, `alerts`, plus `datasets`, `ml_models`, `training_runs`, `training_results`, `wltp_reference`.

## API (v1)

- **Health:** `GET /api/v1/health`
- **Auth:** `POST /api/v1/auth/login`, `POST /api/v1/auth/refresh`, `GET /api/v1/auth/me`, `POST /api/v1/auth/logout`
- **Vehicles:** `GET /api/v1/vehicles`, `GET /api/v1/vehicles/{id}`, `GET /api/v1/vehicles/{id}/summary`, `GET /api/v1/vehicles/{id}/trips`, `GET /api/v1/vehicles/{id}/charging-sessions`
- **Telemetry:** `GET /api/v1/telemetry/{vehicle_id}/signals`, `GET /api/v1/telemetry/{vehicle_id}/timeseries?signal=...&t0=...&t1=...&ds=1s`
- **Trips / Charging:** `GET /api/v1/trips/{trip_id}/detail`, `GET /api/v1/charging/{session_id}/detail`
- **Features:** `GET /api/v1/features/{vehicle_id}/trip-features`, `GET /api/v1/features/{vehicle_id}/rolling?window=7d`
- **Metrics:** `GET /api/v1/metrics/{vehicle_id}/aging`
- **Analytics:** `POST /api/v1/analytics/{vehicle_id}/run`, `GET /api/v1/analytics/{vehicle_id}/runs`, `GET /api/v1/analytics/runs/{run_id}`, `GET /api/v1/analytics/{vehicle_id}/cluster`, `GET /api/v1/analytics/{vehicle_id}/explain`
- **Dashboard:** `GET /api/v1/dashboard/fleet`, `GET /api/v1/dashboard/vehicle/{id}`, `GET /api/v1/dashboard/vehicle/{id}/pack-view`
- **WebSocket:** `ws://localhost:8000/api/v1/ws/bms` — push `{vehicle_id, signal, value, ts}`

See `docs/SUPPLEMENT_API.md` for request/response shapes. Do not put secrets in documentation.
