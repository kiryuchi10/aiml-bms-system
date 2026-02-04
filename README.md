# AIML-BMS System

Battery Management System backend (FastAPI) and frontend (React/Vite) with fleet, telemetry, analytics, and dashboard-optimized APIs.

## Run with Docker Compose

From the project root (`aiml-bms-system`):

```bash
docker compose up -d
```

- API: http://localhost:8000
- API prefix: `/api/v1`
- WebSocket: `ws://localhost:8000/api/v1/ws/bms`

Create the database and tables (run schema once):

```bash
# If using local Postgres: create db then run schema
createdb aimlbms
psql -d aimlbms -f backend/database/schema.sql
```

Environment: copy `backend/.env.example` to `backend/.env` and set values locally (do not commit `.env` or secrets).

## Frontend

From `frontend/`:

```bash
npm install
npm run dev
```

Frontend: http://localhost:5173. Set `VITE_API_BASE=http://localhost:8000` in `.env` if needed (see `frontend/.env.example`).

## Routes

- `/dashboard` — Battery pack information (main)
- `/dashboard/fleet` — Fleet overview
- `/dashboard/vehicle/:id` — Vehicle detail + pack view
- `/dashboard/trips` — Trip explorer
- `/dashboard/research` — Research / analytics

## Docs

- `backend/README.md` — Backend API and run instructions
- `frontend/README.md` — Frontend run and build
- `docs/SUPPLEMENT_API.md` — API contract summary

Do not commit secrets or development credentials; use `.env` and `.env.example` only.
