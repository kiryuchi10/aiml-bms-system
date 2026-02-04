# API Contract (Supplement)

Base URL: `http://localhost:8000`  
Prefix: `/api/v1`  
WebSocket: `ws://localhost:8000/api/v1/ws/bms`

Use `.env` for `DATABASE_URL` and `JWT_SECRET_KEY`; do not put secrets in this doc.

## Auth

- `POST /api/v1/auth/login` — body: `{ email, password }` → `{ access_token, refresh_token, token_type }`
- `POST /api/v1/auth/refresh` — body: `{ refresh_token }` → `{ access_token, refresh_token, token_type }`
- `GET /api/v1/auth/me` — header: `Authorization: Bearer <token>` → `{ id, email, role }`
- `POST /api/v1/auth/logout` — no body

## Vehicles

- `GET /api/v1/vehicles` → `[{ vin, name, meta }]`
- `GET /api/v1/vehicles/{vehicle_id}` → `{ vin, name, meta }`
- `GET /api/v1/vehicles/{vehicle_id}/summary` → `{ vehicle_id, vin, trip_count, charging_count }`
- `GET /api/v1/vehicles/{vehicle_id}/trips?limit=50` → `[{ id, start_ts, end_ts, distance_km }]`
- `GET /api/v1/vehicles/{vehicle_id}/charging-sessions?limit=50` → `[{ id, start_ts, end_ts, start_soc, end_soc }]`

## Telemetry

- `GET /api/v1/telemetry/{vehicle_id}/signals` → `[{ signal }]`
- `GET /api/v1/telemetry/{vehicle_id}/timeseries?signal=...&t0=...&t1=...&ds=1s` → `[{ ts, value }]`

## Trips / Charging

- `GET /api/v1/trips/{trip_id}/detail` → `{ id, vehicle_id, start_ts, end_ts, distance_km }`
- `GET /api/v1/charging/{session_id}/detail` → `{ id, vehicle_id, start_ts, end_ts, start_soc, end_soc }`

## Features / Metrics

- `GET /api/v1/features/{vehicle_id}/trip-features?trip_id=...` → `[{ trip_id, feature_set, features }]`
- `GET /api/v1/features/{vehicle_id}/rolling?window=7d` → `[{ trip_id, feature_set, features }]`
- `GET /api/v1/metrics/{vehicle_id}/aging` → `[{ metric, value, ts }]`

## Analytics

- `POST /api/v1/analytics/{vehicle_id}/run` — body: `{ pipeline: "soc_validate|stress|cluster|risk", params }` → `{ run_id, status }`
- `GET /api/v1/analytics/{vehicle_id}/runs` → `[{ id, pipeline, status, created_at }]`
- `GET /api/v1/analytics/runs/{run_id}` → `{ id, vehicle_id, pipeline, params, result, status }`
- `GET /api/v1/analytics/{vehicle_id}/cluster` → `{ vehicle_id, embedding, labels }`
- `GET /api/v1/analytics/{vehicle_id}/explain` → `{ vehicle_id, feature_importance }`

## Dashboard

- `GET /api/v1/dashboard/fleet` → `[{ vehicle_id, vin, name, trip_count, charging_count }]`
- `GET /api/v1/dashboard/vehicle/{vehicle_id}` → `{ vehicle_id, vin, trip_count, charging_count }`
- `GET /api/v1/dashboard/vehicle/{vehicle_id}/pack-view` → `[{ cell_id, voltage, temperature, soc, is_active, balancing }]`

## WebSocket

- `ws://localhost:8000/api/v1/ws/bms` — server may push `{ vehicle_id, signal, value, ts }`; client may send `{ type: "ping" }` → `{ type: "pong" }`
