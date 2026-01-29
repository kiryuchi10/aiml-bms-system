-- AIML-BMS System - PostgreSQL schema
-- Run after creating the database (e.g. createdb aimlbms)

-- Extensions (optional)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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
-- ml_models: model types used for training (e.g. LSTM, XGBoost)
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
-- training_results: per-dataset, per-model error (one row per run/dataset/model)
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
    overflow_threshold DOUBLE PRECISION DEFAULT 1000.0
);

CREATE INDEX IF NOT EXISTS ix_training_results_run_id    ON training_results (run_id);
CREATE INDEX IF NOT EXISTS ix_training_results_dataset_key ON training_results (dataset_key);
CREATE INDEX IF NOT EXISTS ix_training_results_model_key  ON training_results (model_key);

-- Optional: unique result per run/dataset/model
CREATE UNIQUE INDEX IF NOT EXISTS uq_training_results_run_dataset_model
    ON training_results (run_id, dataset_key, model_key);

-- ---------------------------------------------------------------------------
-- wltp_reference: WLTP driving cycle time series (from WLTP_Driving_cycle_reference.csv)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS wltp_reference (
    id               SERIAL PRIMARY KEY,
    elapsed_s        DOUBLE PRECISION NOT NULL,
    wltp_kmh         DOUBLE PRECISION NOT NULL,
    wltp_current_a   DOUBLE PRECISION NOT NULL,
    current_adapted_a DOUBLE PRECISION NOT NULL
);

CREATE INDEX IF NOT EXISTS ix_wltp_reference_elapsed_s ON wltp_reference (elapsed_s);
