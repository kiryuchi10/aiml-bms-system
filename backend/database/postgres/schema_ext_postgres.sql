-- AIML-BMS System - PostgreSQL extension schema
-- Run after schema.sql (depends on datasets)
-- Purpose: NASA/WLTP pack/cell/cycle/measurements/features meta/safety

-- ---------------------------------------------------------------------------
-- battery_packs: pack-level entities (e.g. B0005, B0006...)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS battery_packs (
    id          SERIAL PRIMARY KEY,
    dataset_id  INTEGER NOT NULL REFERENCES datasets(id) ON DELETE RESTRICT,
    pack_key    VARCHAR(64) NOT NULL,
    chemistry   VARCHAR(64),
    notes       TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'utc')
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_battery_packs_dataset_pack
    ON battery_packs (dataset_id, pack_key);

CREATE INDEX IF NOT EXISTS ix_battery_packs_pack_key ON battery_packs (pack_key);

-- ---------------------------------------------------------------------------
-- battery_modules: module-level entities (optional; EV pack may have modules)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS battery_modules (
    id          SERIAL PRIMARY KEY,
    pack_id     INTEGER NOT NULL REFERENCES battery_packs(id) ON DELETE CASCADE,
    module_no   INTEGER NOT NULL,
    cell_count  INTEGER NOT NULL DEFAULT 18,
    notes       TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_battery_modules_pack_module
    ON battery_modules (pack_id, module_no);

CREATE INDEX IF NOT EXISTS ix_battery_modules_pack_id ON battery_modules (pack_id);

-- ---------------------------------------------------------------------------
-- battery_cells: cell-level entities (E1..E18 etc)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS battery_cells (
    id          SERIAL PRIMARY KEY,
    pack_id     INTEGER NOT NULL REFERENCES battery_packs(id) ON DELETE CASCADE,
    module_id   INTEGER REFERENCES battery_modules(id) ON DELETE SET NULL,
    cell_key    VARCHAR(32) NOT NULL,
    serial_no   VARCHAR(64),
    notes       TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_battery_cells_pack_cell
    ON battery_cells (pack_id, cell_key);

CREATE INDEX IF NOT EXISTS ix_battery_cells_pack_id ON battery_cells (pack_id);
CREATE INDEX IF NOT EXISTS ix_battery_cells_module_id ON battery_cells (module_id);

-- ---------------------------------------------------------------------------
-- cycles: cycle metadata per pack
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cycles (
    id          SERIAL PRIMARY KEY,
    pack_id     INTEGER NOT NULL REFERENCES battery_packs(id) ON DELETE CASCADE,
    cycle_index INTEGER NOT NULL,
    start_ts    TIMESTAMPTZ,
    end_ts      TIMESTAMPTZ,
    ambient_c   DOUBLE PRECISION,
    notes       TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_cycles_pack_cycle
    ON cycles (pack_id, cycle_index);

CREATE INDEX IF NOT EXISTS ix_cycles_pack_id ON cycles (pack_id);

-- ---------------------------------------------------------------------------
-- cycle_steps: charge/discharge/rest segments inside a cycle
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cycle_steps (
    id          SERIAL PRIMARY KEY,
    cycle_id    INTEGER NOT NULL REFERENCES cycles(id) ON DELETE CASCADE,
    step_type   VARCHAR(16) NOT NULL,
    step_index  INTEGER NOT NULL,
    start_ts    TIMESTAMPTZ,
    end_ts      TIMESTAMPTZ,
    duration_s  DOUBLE PRECISION,
    notes       TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_cycle_steps_cycle_step
    ON cycle_steps (cycle_id, step_index);

CREATE INDEX IF NOT EXISTS ix_cycle_steps_cycle_id ON cycle_steps (cycle_id);
CREATE INDEX IF NOT EXISTS ix_cycle_steps_step_type ON cycle_steps (step_type);

-- ---------------------------------------------------------------------------
-- measurements_pack: pack-level time series (optional; bulk in parquet)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS measurements_pack (
    id      BIGSERIAL PRIMARY KEY,
    pack_id INTEGER NOT NULL REFERENCES battery_packs(id) ON DELETE CASCADE,
    ts      TIMESTAMPTZ NOT NULL,
    v_pack  DOUBLE PRECISION,
    i_pack  DOUBLE PRECISION,
    t_max   DOUBLE PRECISION,
    soc     DOUBLE PRECISION,
    soh     DOUBLE PRECISION
);

CREATE INDEX IF NOT EXISTS ix_measurements_pack_pack_ts
    ON measurements_pack (pack_id, ts);

-- ---------------------------------------------------------------------------
-- measurements_cell: cell-level snapshot/time series (optional)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS measurements_cell (
    id        BIGSERIAL PRIMARY KEY,
    pack_id   INTEGER NOT NULL REFERENCES battery_packs(id) ON DELETE CASCADE,
    cell_id   INTEGER NOT NULL REFERENCES battery_cells(id) ON DELETE CASCADE,
    ts        TIMESTAMPTZ NOT NULL,
    v_cell    DOUBLE PRECISION,
    t_cell    DOUBLE PRECISION,
    r_cell    DOUBLE PRECISION,
    balancing BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS ix_measurements_cell_pack_ts
    ON measurements_cell (pack_id, ts);

CREATE INDEX IF NOT EXISTS ix_measurements_cell_cell_ts
    ON measurements_cell (cell_id, ts);

-- ---------------------------------------------------------------------------
-- feature_artifacts: parquet feature file meta (path/version/columns)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS feature_artifacts (
    id            SERIAL PRIMARY KEY,
    pack_id       INTEGER REFERENCES battery_packs(id) ON DELETE CASCADE,
    cycle_id      INTEGER REFERENCES cycles(id) ON DELETE CASCADE,
    artifact_type VARCHAR(32) NOT NULL,
    file_path     TEXT NOT NULL,
    file_sha256   VARCHAR(64),
    row_count     BIGINT,
    columns_json  JSONB,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'utc')
);

CREATE INDEX IF NOT EXISTS ix_feature_artifacts_pack_id ON feature_artifacts(pack_id);
CREATE INDEX IF NOT EXISTS ix_feature_artifacts_cycle_id ON feature_artifacts(cycle_id);
CREATE INDEX IF NOT EXISTS ix_feature_artifacts_type ON feature_artifacts(artifact_type);

-- ---------------------------------------------------------------------------
-- inference_runs: one inference job (online or batch)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS inference_runs (
    id         SERIAL PRIMARY KEY,
    pack_id    INTEGER REFERENCES battery_packs(id) ON DELETE CASCADE,
    model_key  VARCHAR(64) NOT NULL,
    mode       VARCHAR(16) NOT NULL DEFAULT 'batch',
    created_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'utc')
);

CREATE INDEX IF NOT EXISTS ix_inference_runs_pack_id ON inference_runs(pack_id);
CREATE INDEX IF NOT EXISTS ix_inference_runs_model_key ON inference_runs(model_key);

-- ---------------------------------------------------------------------------
-- inference_results: predicted SOC/SOH/RUL/SOP (per cycle / per timestamp)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS inference_results (
    id              BIGSERIAL PRIMARY KEY,
    run_id          INTEGER NOT NULL REFERENCES inference_runs(id) ON DELETE CASCADE,
    pack_id         INTEGER REFERENCES battery_packs(id) ON DELETE CASCADE,
    cycle_id        INTEGER REFERENCES cycles(id) ON DELETE SET NULL,
    ts              TIMESTAMPTZ,
    soc_pred        DOUBLE PRECISION,
    soh_pred        DOUBLE PRECISION,
    rul_pred_cycles DOUBLE PRECISION,
    sop_kw_pred     DOUBLE PRECISION,
    extra_json      JSONB
);

CREATE INDEX IF NOT EXISTS ix_inference_results_run_id ON inference_results(run_id);
CREATE INDEX IF NOT EXISTS ix_inference_results_pack_ts ON inference_results(pack_id, ts);

-- ---------------------------------------------------------------------------
-- safety_events: faults/alarms/trips
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS safety_events (
    id        BIGSERIAL PRIMARY KEY,
    pack_id   INTEGER NOT NULL REFERENCES battery_packs(id) ON DELETE CASCADE,
    ts        TIMESTAMPTZ NOT NULL,
    level     VARCHAR(16) NOT NULL,
    code      VARCHAR(64) NOT NULL,
    message   TEXT,
    data_json JSONB
);

CREATE INDEX IF NOT EXISTS ix_safety_events_pack_ts ON safety_events(pack_id, ts);
CREATE INDEX IF NOT EXISTS ix_safety_events_code ON safety_events(code);

-- ---------------------------------------------------------------------------
-- thresholds: editable rule thresholds (admin)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS thresholds (
    id         SERIAL PRIMARY KEY,
    key        VARCHAR(64) NOT NULL UNIQUE,
    value      DOUBLE PRECISION NOT NULL,
    unit       VARCHAR(16),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'utc')
);

CREATE INDEX IF NOT EXISTS ix_thresholds_key ON thresholds(key);
