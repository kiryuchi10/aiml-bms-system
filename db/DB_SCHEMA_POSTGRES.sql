-- =========================================
-- AI/ML BMS Suite - PostgreSQL Schema
-- Principles:
-- 1) Raw != Feature != Metric separation
-- 2) Time-series tables are append-only
-- =========================================

CREATE TABLE IF NOT EXISTS vehicle (
  id            BIGSERIAL PRIMARY KEY,
  vin           TEXT UNIQUE,
  name          TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -------------------------
-- RAW Telemetry (append-only)
-- -------------------------
CREATE TABLE IF NOT EXISTS telemetry_pack (
  id            BIGSERIAL PRIMARY KEY,
  vehicle_id    BIGINT REFERENCES vehicle(id),
  ts            TIMESTAMPTZ NOT NULL,
  pack_voltage  DOUBLE PRECISION,
  pack_current  DOUBLE PRECISION,
  pack_power    DOUBLE PRECISION,
  soc           DOUBLE PRECISION,
  soh           DOUBLE PRECISION,
  pack_temp     DOUBLE PRECISION,
  source        TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pack_vehicle_ts ON telemetry_pack(vehicle_id, ts);

CREATE TABLE IF NOT EXISTS telemetry_module (
  id            BIGSERIAL PRIMARY KEY,
  vehicle_id    BIGINT REFERENCES vehicle(id),
  module_id     INT NOT NULL,
  ts            TIMESTAMPTZ NOT NULL,
  module_voltage DOUBLE PRECISION,
  module_current DOUBLE PRECISION,
  module_temp    DOUBLE PRECISION,
  v_min          DOUBLE PRECISION,
  v_max          DOUBLE PRECISION,
  t_min          DOUBLE PRECISION,
  t_max          DOUBLE PRECISION,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_module_vehicle_mod_ts ON telemetry_module(vehicle_id, module_id, ts);

CREATE TABLE IF NOT EXISTS telemetry_cell (
  id            BIGSERIAL PRIMARY KEY,
  vehicle_id    BIGINT REFERENCES vehicle(id),
  module_id     INT,
  cell_id       INT NOT NULL,
  ts            TIMESTAMPTZ NOT NULL,
  voltage       DOUBLE PRECISION,
  current       DOUBLE PRECISION,
  temperature   DOUBLE PRECISION,
  soc           DOUBLE PRECISION,
  balancing     BOOLEAN NOT NULL DEFAULT FALSE,
  source        TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cell_vehicle_cell_ts ON telemetry_cell(vehicle_id, cell_id, ts);

-- -------------------------
-- FEATURES (engineered)
-- -------------------------
CREATE TABLE IF NOT EXISTS feature_cell (
  id            BIGSERIAL PRIMARY KEY,
  vehicle_id    BIGINT REFERENCES vehicle(id),
  module_id     INT,
  cell_id       INT NOT NULL,
  ts_window_end TIMESTAMPTZ NOT NULL,
  window_sec    INT NOT NULL,
  v_mean        DOUBLE PRECISION,
  v_std         DOUBLE PRECISION,
  t_mean        DOUBLE PRECISION,
  t_std         DOUBLE PRECISION,
  dv_dt         DOUBLE PRECISION,
  dt_dt         DOUBLE PRECISION,
  i_mean        DOUBLE PRECISION,
  i_std         DOUBLE PRECISION,
  z_norm_version TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feat_vehicle_cell_ts ON feature_cell(vehicle_id, cell_id, ts_window_end);

-- -------------------------
-- METRICS (aging/health summaries)
-- -------------------------
CREATE TABLE IF NOT EXISTS metric_aging (
  id            BIGSERIAL PRIMARY KEY,
  vehicle_id    BIGINT REFERENCES vehicle(id),
  module_id     INT,
  cell_id       INT,
  ts            TIMESTAMPTZ NOT NULL,
  aging_index   DOUBLE PRECISION,
  resistance_proxy DOUBLE PRECISION,
  capacity_proxy   DOUBLE PRECISION,
  soh_proxy        DOUBLE PRECISION,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_metric_vehicle_ts ON metric_aging(vehicle_id, ts);

-- -------------------------
-- EVENTS
-- -------------------------
CREATE TABLE IF NOT EXISTS balancing_event (
  id            BIGSERIAL PRIMARY KEY,
  vehicle_id    BIGINT REFERENCES vehicle(id),
  module_id     INT,
  cell_id       INT NOT NULL,
  ts            TIMESTAMPTZ NOT NULL,
  mode          TEXT,
  reason        TEXT,
  onoff         BOOLEAN NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_balance_vehicle_cell_ts ON balancing_event(vehicle_id, cell_id, ts);

CREATE TABLE IF NOT EXISTS alarm_event (
  id            BIGSERIAL PRIMARY KEY,
  vehicle_id    BIGINT REFERENCES vehicle(id),
  module_id     INT,
  cell_id       INT,
  ts            TIMESTAMPTZ NOT NULL,
  severity      TEXT NOT NULL,
  alarm_type    TEXT NOT NULL,
  value         DOUBLE PRECISION,
  threshold     DOUBLE PRECISION,
  rationale     TEXT,
  source        TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alarm_vehicle_ts ON alarm_event(vehicle_id, ts);
CREATE INDEX IF NOT EXISTS idx_alarm_vehicle_cell_ts ON alarm_event(vehicle_id, cell_id, ts);

-- -------------------------
-- ML RUNS
-- -------------------------
CREATE TABLE IF NOT EXISTS ml_run (
  id            BIGSERIAL PRIMARY KEY,
  vehicle_id    BIGINT REFERENCES vehicle(id),
  run_name      TEXT,
  dataset_name  TEXT NOT NULL,
  model_name    TEXT NOT NULL,
  status        TEXT NOT NULL,
  config_json   JSONB,
  artifact_uri  TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at   TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS ml_metric (
  id            BIGSERIAL PRIMARY KEY,
  ml_run_id     BIGINT REFERENCES ml_run(id) ON DELETE CASCADE,
  metric_name   TEXT NOT NULL,
  metric_value  DOUBLE PRECISION,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ml_metric_run ON ml_metric(ml_run_id);
