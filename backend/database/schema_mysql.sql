-- =========================================
-- AI/ML BMS Suite - MySQL 8 Schema
-- =========================================

CREATE TABLE IF NOT EXISTS vehicle (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  vin         VARCHAR(64) UNIQUE,
  name        VARCHAR(128),
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS telemetry_pack (
  id           BIGINT AUTO_INCREMENT PRIMARY KEY,
  vehicle_id   BIGINT,
  ts           DATETIME(6) NOT NULL,
  pack_voltage DOUBLE,
  pack_current DOUBLE,
  pack_power   DOUBLE,
  soc          DOUBLE,
  soh          DOUBLE,
  pack_temp    DOUBLE,
  source       VARCHAR(64),
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_pack_vehicle_ts (vehicle_id, ts),
  CONSTRAINT fk_pack_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicle(id)
);

CREATE TABLE IF NOT EXISTS telemetry_module (
  id            BIGINT AUTO_INCREMENT PRIMARY KEY,
  vehicle_id    BIGINT,
  module_id     INT NOT NULL,
  ts            DATETIME(6) NOT NULL,
  module_voltage DOUBLE,
  module_current DOUBLE,
  module_temp    DOUBLE,
  v_min          DOUBLE,
  v_max          DOUBLE,
  t_min          DOUBLE,
  t_max          DOUBLE,
  created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_module_vehicle_mod_ts (vehicle_id, module_id, ts),
  CONSTRAINT fk_module_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicle(id)
);

CREATE TABLE IF NOT EXISTS telemetry_cell (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  vehicle_id  BIGINT,
  module_id   INT,
  cell_id     INT NOT NULL,
  ts          DATETIME(6) NOT NULL,
  voltage     DOUBLE,
  current     DOUBLE,
  temperature DOUBLE,
  soc         DOUBLE,
  balancing   BOOLEAN NOT NULL DEFAULT FALSE,
  source      VARCHAR(64),
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_cell_vehicle_cell_ts (vehicle_id, cell_id, ts),
  CONSTRAINT fk_cell_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicle(id)
);

CREATE TABLE IF NOT EXISTS feature_cell (
  id            BIGINT AUTO_INCREMENT PRIMARY KEY,
  vehicle_id    BIGINT,
  module_id     INT,
  cell_id       INT NOT NULL,
  ts_window_end DATETIME(6) NOT NULL,
  window_sec    INT NOT NULL,
  v_mean        DOUBLE,
  v_std         DOUBLE,
  t_mean        DOUBLE,
  t_std         DOUBLE,
  dv_dt         DOUBLE,
  dt_dt         DOUBLE,
  i_mean        DOUBLE,
  i_std         DOUBLE,
  z_norm_version VARCHAR(128),
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_feat_vehicle_cell_ts (vehicle_id, cell_id, ts_window_end),
  CONSTRAINT fk_feat_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicle(id)
);

CREATE TABLE IF NOT EXISTS metric_aging (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  vehicle_id      BIGINT,
  module_id       INT,
  cell_id         INT,
  ts              DATETIME(6) NOT NULL,
  aging_index     DOUBLE,
  resistance_proxy DOUBLE,
  capacity_proxy   DOUBLE,
  soh_proxy        DOUBLE,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_metric_vehicle_ts (vehicle_id, ts),
  CONSTRAINT fk_metric_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicle(id)
);

CREATE TABLE IF NOT EXISTS balancing_event (
  id         BIGINT AUTO_INCREMENT PRIMARY KEY,
  vehicle_id BIGINT,
  module_id  INT,
  cell_id    INT NOT NULL,
  ts         DATETIME(6) NOT NULL,
  mode       VARCHAR(32),
  reason     TEXT,
  onoff      BOOLEAN NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_balance_vehicle_cell_ts (vehicle_id, cell_id, ts),
  CONSTRAINT fk_balance_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicle(id)
);

CREATE TABLE IF NOT EXISTS alarm_event (
  id         BIGINT AUTO_INCREMENT PRIMARY KEY,
  vehicle_id BIGINT,
  module_id  INT,
  cell_id    INT,
  ts         DATETIME(6) NOT NULL,
  severity   VARCHAR(16) NOT NULL,
  alarm_type VARCHAR(64) NOT NULL,
  value      DOUBLE,
  threshold  DOUBLE,
  rationale  TEXT,
  source     VARCHAR(32),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_alarm_vehicle_ts (vehicle_id, ts),
  INDEX idx_alarm_vehicle_cell_ts (vehicle_id, cell_id, ts),
  CONSTRAINT fk_alarm_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicle(id)
);

CREATE TABLE IF NOT EXISTS ml_run (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  vehicle_id  BIGINT,
  run_name    VARCHAR(128),
  dataset_name VARCHAR(128) NOT NULL,
  model_name  VARCHAR(64) NOT NULL,
  status      VARCHAR(32) NOT NULL,
  config_json JSON,
  artifact_uri TEXT,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  finished_at TIMESTAMP NULL,
  CONSTRAINT fk_ml_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicle(id)
);

CREATE TABLE IF NOT EXISTS ml_metric (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  ml_run_id   BIGINT NOT NULL,
  metric_name VARCHAR(64) NOT NULL,
  metric_value DOUBLE,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_ml_metric_run (ml_run_id),
  CONSTRAINT fk_ml_metric_run FOREIGN KEY (ml_run_id) REFERENCES ml_run(id) ON DELETE CASCADE
);
