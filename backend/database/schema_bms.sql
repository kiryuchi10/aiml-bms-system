-- BMS real-time / parquet-derived schema (Master/Slave/PMDU simulation)
-- Run after main schema. Uses same DB (aimlbms).
-- Env: DATABASE_URL, PACK_PARQUET, CELL_PARQUET, etc.

-- BMS vehicles (string id, e.g. MBM165-P50-B)
CREATE TABLE IF NOT EXISTS bms_vehicles (
  vehicle_id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pack time-series (one row per timestamp per vehicle)
CREATE TABLE IF NOT EXISTS pack_timeseries (
  id BIGSERIAL PRIMARY KEY,
  vehicle_id TEXT NOT NULL REFERENCES bms_vehicles(vehicle_id) ON DELETE CASCADE,
  ts TIMESTAMPTZ NOT NULL,
  pack_voltage DOUBLE PRECISION,
  pack_current DOUBLE PRECISION,
  pack_temp DOUBLE PRECISION,
  ambient_temp DOUBLE PRECISION,
  soc DOUBLE PRECISION,
  soh DOUBLE PRECISION,
  mode TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_pack_ts ON pack_timeseries(vehicle_id, ts);
CREATE INDEX IF NOT EXISTS idx_pack_ts ON pack_timeseries(vehicle_id, ts);

-- Cell time-series (one row per cell per timestamp)
CREATE TABLE IF NOT EXISTS cell_timeseries (
  id BIGSERIAL PRIMARY KEY,
  vehicle_id TEXT NOT NULL REFERENCES bms_vehicles(vehicle_id) ON DELETE CASCADE,
  ts TIMESTAMPTZ NOT NULL,
  cell_id INTEGER NOT NULL,
  voltage DOUBLE PRECISION,
  temperature DOUBLE PRECISION,
  current DOUBLE PRECISION,
  abs_soc DOUBLE PRECISION,
  soh DOUBLE PRECISION,
  balancing BOOLEAN DEFAULT FALSE,
  alarm BOOLEAN DEFAULT FALSE
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_cell_ts ON cell_timeseries(vehicle_id, ts, cell_id);
CREATE INDEX IF NOT EXISTS idx_cell_ts ON cell_timeseries(vehicle_id, ts);

-- Feature stores (JSONB per row)
CREATE TABLE IF NOT EXISTS soc_features (
  id BIGSERIAL PRIMARY KEY,
  vehicle_id TEXT NOT NULL REFERENCES bms_vehicles(vehicle_id) ON DELETE CASCADE,
  ts TIMESTAMPTZ,
  feature JSONB NOT NULL
);
CREATE TABLE IF NOT EXISTS soh_features (
  id BIGSERIAL PRIMARY KEY,
  vehicle_id TEXT NOT NULL REFERENCES bms_vehicles(vehicle_id) ON DELETE CASCADE,
  ts TIMESTAMPTZ,
  feature JSONB NOT NULL
);
CREATE TABLE IF NOT EXISTS thermal_features (
  id BIGSERIAL PRIMARY KEY,
  vehicle_id TEXT NOT NULL REFERENCES bms_vehicles(vehicle_id) ON DELETE CASCADE,
  ts TIMESTAMPTZ,
  feature JSONB NOT NULL
);
CREATE TABLE IF NOT EXISTS eis_features (
  id BIGSERIAL PRIMARY KEY,
  vehicle_id TEXT NOT NULL REFERENCES bms_vehicles(vehicle_id) ON DELETE CASCADE,
  ts TIMESTAMPTZ,
  feature JSONB NOT NULL
);

-- Alarms (active / latched lifecycle)
CREATE TABLE IF NOT EXISTS bms_alarms (
  id BIGSERIAL PRIMARY KEY,
  vehicle_id TEXT NOT NULL REFERENCES bms_vehicles(vehicle_id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  level TEXT NOT NULL DEFAULT 'WARN',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_latched BOOLEAN NOT NULL DEFAULT FALSE,
  first_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_bms_alarm_active ON bms_alarms(vehicle_id, is_active, is_latched);

-- Balancing actions (audit)
CREATE TABLE IF NOT EXISTS balancing_actions (
  id BIGSERIAL PRIMARY KEY,
  vehicle_id TEXT NOT NULL REFERENCES bms_vehicles(vehicle_id) ON DELETE CASCADE,
  ts TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  cell_id INTEGER NOT NULL,
  action TEXT NOT NULL,
  reason TEXT
);
