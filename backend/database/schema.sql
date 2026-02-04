-- AIML-BMS System - PostgreSQL schema
-- Run after creating the database (e.g. createdb aimlbms)
-- Base URL: http://localhost:8000 | Prefix: /api/v1

-- ---------------------------------------------------------------------------
-- users: RBAC (admin, analyst, viewer)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id         SERIAL PRIMARY KEY,
    email      VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role       VARCHAR(32) NOT NULL DEFAULT 'viewer',
    is_active  BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'utc'),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'utc')
);
CREATE INDEX IF NOT EXISTS ix_users_email ON users (email);
CREATE INDEX IF NOT EXISTS ix_users_role ON users (role);

-- ---------------------------------------------------------------------------
-- vehicles: fleet / vehicle meta
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS vehicles (
    id          SERIAL PRIMARY KEY,
    vin         VARCHAR(64) NOT NULL UNIQUE,
    name        VARCHAR(128),
    meta        JSONB DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'utc'),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'utc')
);
CREATE INDEX IF NOT EXISTS ix_vehicles_vin ON vehicles (vin);

-- ---------------------------------------------------------------------------
-- trips: trip explorer
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS trips (
    id          SERIAL PRIMARY KEY,
    vehicle_id  INTEGER NOT NULL REFERENCES vehicles (id) ON DELETE CASCADE,
    start_ts    TIMESTAMPTZ NOT NULL,
    end_ts      TIMESTAMPTZ NOT NULL,
    distance_km DOUBLE PRECISION,
    meta        JSONB DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'utc')
);
CREATE INDEX IF NOT EXISTS ix_trips_vehicle_id ON trips (vehicle_id);
CREATE INDEX IF NOT EXISTS ix_trips_start_ts ON trips (start_ts);

-- ---------------------------------------------------------------------------
-- charging_sessions: charging explorer
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS charging_sessions (
    id          SERIAL PRIMARY KEY,
    vehicle_id  INTEGER NOT NULL REFERENCES vehicles (id) ON DELETE CASCADE,
    start_ts    TIMESTAMPTZ NOT NULL,
    end_ts      TIMESTAMPTZ NOT NULL,
    start_soc   DOUBLE PRECISION,
    end_soc     DOUBLE PRECISION,
    meta        JSONB DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'utc')
);
CREATE INDEX IF NOT EXISTS ix_charging_sessions_vehicle_id ON charging_sessions (vehicle_id);
CREATE INDEX IF NOT EXISTS ix_charging_sessions_start_ts ON charging_sessions (start_ts);

-- ---------------------------------------------------------------------------
-- telemetry_raw: raw/time-series (signal, value, ts)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS telemetry_raw (
    id          BIGSERIAL PRIMARY KEY,
    vehicle_id  INTEGER NOT NULL REFERENCES vehicles (id) ON DELETE CASCADE,
    signal      VARCHAR(128) NOT NULL,
    value       DOUBLE PRECISION NOT NULL,
    ts          TIMESTAMPTZ NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'utc')
);
CREATE INDEX IF NOT EXISTS ix_telemetry_raw_vehicle_ts ON telemetry_raw (vehicle_id, ts);
CREATE INDEX IF NOT EXISTS ix_telemetry_raw_signal ON telemetry_raw (vehicle_id, signal, ts);

-- ---------------------------------------------------------------------------
-- feature_trip: trip-level features (feature store)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS feature_trip (
    id          SERIAL PRIMARY KEY,
    vehicle_id  INTEGER NOT NULL REFERENCES vehicles (id) ON DELETE CASCADE,
    trip_id     INTEGER REFERENCES trips (id) ON DELETE SET NULL,
    feature_set VARCHAR(64) NOT NULL,
    features    JSONB NOT NULL DEFAULT '{}',
    computed_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'utc'),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'utc')
);
CREATE INDEX IF NOT EXISTS ix_feature_trip_vehicle ON feature_trip (vehicle_id);
CREATE INDEX IF NOT EXISTS ix_feature_trip_trip ON feature_trip (trip_id);

-- ---------------------------------------------------------------------------
-- metric_aging: vehicle aging / SOH proxy metrics
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS metric_aging (
    id          SERIAL PRIMARY KEY,
    vehicle_id  INTEGER NOT NULL REFERENCES vehicles (id) ON DELETE CASCADE,
    metric      VARCHAR(64) NOT NULL,
    value       DOUBLE PRECISION NOT NULL,
    ts          TIMESTAMPTZ NOT NULL,
    meta        JSONB DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'utc')
);
CREATE INDEX IF NOT EXISTS ix_metric_aging_vehicle_ts ON metric_aging (vehicle_id, ts);

-- ---------------------------------------------------------------------------
-- model_run: analytics run (soc_validate, stress, cluster, risk)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS model_run (
    id          SERIAL PRIMARY KEY,
    vehicle_id  INTEGER NOT NULL REFERENCES vehicles (id) ON DELETE CASCADE,
    pipeline    VARCHAR(64) NOT NULL,
    params      JSONB DEFAULT '{}',
    result      JSONB DEFAULT '{}',
    status      VARCHAR(32) NOT NULL DEFAULT 'completed',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'utc')
);
CREATE INDEX IF NOT EXISTS ix_model_run_vehicle ON model_run (vehicle_id);
CREATE INDEX IF NOT EXISTS ix_model_run_created ON model_run (created_at DESC);

-- ---------------------------------------------------------------------------
-- alerts: vehicle alerts (severity, message)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS alerts (
    id          SERIAL PRIMARY KEY,
    vehicle_id  INTEGER NOT NULL REFERENCES vehicles (id) ON DELETE CASCADE,
    severity    VARCHAR(32) NOT NULL,
    message     TEXT NOT NULL,
    ts          TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'utc'),
    acknowledged BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'utc')
);
CREATE INDEX IF NOT EXISTS ix_alerts_vehicle ON alerts (vehicle_id);
CREATE INDEX IF NOT EXISTS ix_alerts_ts ON alerts (ts DESC);

-- ---------------------------------------------------------------------------
-- datasets: reference dataset metadata (e.g. MATR, HUST, CALCE)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS datasets (
    id          SERIAL PRIMARY KEY,
    key         VARCHAR(32) NOT NULL UNIQUE,
    name        VARCHAR(128) NOT NULL,
    description TEXT
);
CREATE INDEX IF NOT EXISTS ix_datasets_key ON datasets (key);

-- ---------------------------------------------------------------------------
-- ml_models: model types (e.g. LSTM, XGBoost)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ml_models (
    id             SERIAL PRIMARY KEY,
    key            VARCHAR(64) NOT NULL UNIQUE,
    name           VARCHAR(128) NOT NULL,
    seed_sensitive BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS ix_ml_models_key ON ml_models (key);

-- ---------------------------------------------------------------------------
-- training_runs: one training job / comparison run
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS training_runs (
    id         SERIAL PRIMARY KEY,
    status     VARCHAR(32) NOT NULL DEFAULT 'completed',
    created_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'utc')
);

-- ---------------------------------------------------------------------------
-- training_results: per-dataset, per-model error
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS training_results (
    id                 SERIAL PRIMARY KEY,
    run_id             INTEGER NOT NULL REFERENCES training_runs (id) ON DELETE CASCADE,
    dataset_key        VARCHAR(32) NOT NULL,
    model_key          VARCHAR(64) NOT NULL,
    error_value        DOUBLE PRECISION,
    error_mean         DOUBLE PRECISION,
    error_std          DOUBLE PRECISION,
    is_overflow        BOOLEAN NOT NULL DEFAULT FALSE,
    overflow_threshold  DOUBLE PRECISION DEFAULT 1000.0
);
CREATE INDEX IF NOT EXISTS ix_training_results_run_id ON training_results (run_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_training_results_run_dataset_model
    ON training_results (run_id, dataset_key, model_key);

-- ---------------------------------------------------------------------------
-- wltp_reference: WLTP driving cycle time series
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS wltp_reference (
    id               SERIAL PRIMARY KEY,
    elapsed_s        DOUBLE PRECISION NOT NULL,
    wltp_kmh         DOUBLE PRECISION NOT NULL,
    wltp_current_a   DOUBLE PRECISION NOT NULL,
    current_adapted_a DOUBLE PRECISION NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_wltp_reference_elapsed_s ON wltp_reference (elapsed_s);
