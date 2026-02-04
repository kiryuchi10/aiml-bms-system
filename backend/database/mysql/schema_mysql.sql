-- AIML-BMS System - MySQL 8.0+ schema (InnoDB)
-- Create DB first: CREATE DATABASE aimlbms ...; USE aimlbms;
-- JSONB -> JSON, TIMESTAMPTZ -> DATETIME, SERIAL -> INT AUTO_INCREMENT

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ---------------------------------------------------------------------------
-- datasets
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS datasets (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    `key`       VARCHAR(32) NOT NULL UNIQUE,
    name        VARCHAR(128) NOT NULL,
    description TEXT
) ENGINE=InnoDB;

CREATE INDEX ix_datasets_key ON datasets(`key`);

-- ---------------------------------------------------------------------------
-- ml_models
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ml_models (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    `key`          VARCHAR(64) NOT NULL UNIQUE,
    name           VARCHAR(128) NOT NULL,
    seed_sensitive TINYINT(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB;

CREATE INDEX ix_ml_models_key ON ml_models(`key`);

-- ---------------------------------------------------------------------------
-- training_runs
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS training_runs (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    status     VARCHAR(32) NOT NULL DEFAULT 'completed',
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- training_results
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS training_results (
    id                 INT AUTO_INCREMENT PRIMARY KEY,
    run_id             INT NOT NULL,
    dataset_key        VARCHAR(32) NOT NULL,
    model_key          VARCHAR(64) NOT NULL,
    error_value        DOUBLE NULL,
    error_mean         DOUBLE NULL,
    error_std          DOUBLE NULL,
    is_overflow        TINYINT(1) NOT NULL DEFAULT 0,
    overflow_threshold DOUBLE NULL DEFAULT 1000.0,
    CONSTRAINT fk_training_results_run
        FOREIGN KEY (run_id) REFERENCES training_runs(id)
        ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX ix_training_results_run_id       ON training_results(run_id);
CREATE INDEX ix_training_results_dataset_key  ON training_results(dataset_key);
CREATE INDEX ix_training_results_model_key    ON training_results(model_key);
CREATE UNIQUE INDEX uq_training_results_run_dataset_model
    ON training_results(run_id, dataset_key, model_key);

-- ---------------------------------------------------------------------------
-- wltp_reference
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS wltp_reference (
    id                 INT AUTO_INCREMENT PRIMARY KEY,
    elapsed_s          DOUBLE NOT NULL,
    wltp_kmh           DOUBLE NOT NULL,
    wltp_current_a     DOUBLE NOT NULL,
    current_adapted_a  DOUBLE NOT NULL
) ENGINE=InnoDB;

CREATE INDEX ix_wltp_reference_elapsed_s ON wltp_reference(elapsed_s);

-- ---------------------------------------------------------------------------
-- battery_packs
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS battery_packs (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    dataset_id  INT NOT NULL,
    pack_key    VARCHAR(64) NOT NULL,
    chemistry   VARCHAR(64) NULL,
    notes       TEXT NULL,
    created_at  DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_battery_packs_dataset
        FOREIGN KEY (dataset_id) REFERENCES datasets(id)
        ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE UNIQUE INDEX uq_battery_packs_dataset_pack ON battery_packs(dataset_id, pack_key);
CREATE INDEX ix_battery_packs_pack_key ON battery_packs(pack_key);

-- ---------------------------------------------------------------------------
-- battery_modules
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS battery_modules (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    pack_id     INT NOT NULL,
    module_no   INT NOT NULL,
    cell_count  INT NOT NULL DEFAULT 18,
    notes       TEXT NULL,
    CONSTRAINT fk_battery_modules_pack
        FOREIGN KEY (pack_id) REFERENCES battery_packs(id)
        ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE UNIQUE INDEX uq_battery_modules_pack_module ON battery_modules(pack_id, module_no);
CREATE INDEX ix_battery_modules_pack_id ON battery_modules(pack_id);

-- ---------------------------------------------------------------------------
-- battery_cells
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS battery_cells (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    pack_id     INT NOT NULL,
    module_id   INT NULL,
    cell_key    VARCHAR(32) NOT NULL,
    serial_no   VARCHAR(64) NULL,
    notes       TEXT NULL,
    CONSTRAINT fk_battery_cells_pack
        FOREIGN KEY (pack_id) REFERENCES battery_packs(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_battery_cells_module
        FOREIGN KEY (module_id) REFERENCES battery_modules(id)
        ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE UNIQUE INDEX uq_battery_cells_pack_cell ON battery_cells(pack_id, cell_key);
CREATE INDEX ix_battery_cells_pack_id ON battery_cells(pack_id);
CREATE INDEX ix_battery_cells_module_id ON battery_cells(module_id);

-- ---------------------------------------------------------------------------
-- cycles
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cycles (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    pack_id     INT NOT NULL,
    cycle_index INT NOT NULL,
    start_ts    DATETIME(6) NULL,
    end_ts      DATETIME(6) NULL,
    ambient_c   DOUBLE NULL,
    notes       TEXT NULL,
    CONSTRAINT fk_cycles_pack
        FOREIGN KEY (pack_id) REFERENCES battery_packs(id)
        ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE UNIQUE INDEX uq_cycles_pack_cycle ON cycles(pack_id, cycle_index);
CREATE INDEX ix_cycles_pack_id ON cycles(pack_id);

-- ---------------------------------------------------------------------------
-- cycle_steps
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cycle_steps (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    cycle_id    INT NOT NULL,
    step_type   VARCHAR(16) NOT NULL,
    step_index  INT NOT NULL,
    start_ts    DATETIME(6) NULL,
    end_ts      DATETIME(6) NULL,
    duration_s  DOUBLE NULL,
    notes       TEXT NULL,
    CONSTRAINT fk_cycle_steps_cycle
        FOREIGN KEY (cycle_id) REFERENCES cycles(id)
        ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE UNIQUE INDEX uq_cycle_steps_cycle_step ON cycle_steps(cycle_id, step_index);
CREATE INDEX ix_cycle_steps_cycle_id ON cycle_steps(cycle_id);
CREATE INDEX ix_cycle_steps_step_type ON cycle_steps(step_type);

-- ---------------------------------------------------------------------------
-- measurements_pack
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS measurements_pack (
    id      BIGINT AUTO_INCREMENT PRIMARY KEY,
    pack_id INT NOT NULL,
    ts      DATETIME(6) NOT NULL,
    v_pack  DOUBLE NULL,
    i_pack  DOUBLE NULL,
    t_max   DOUBLE NULL,
    soc     DOUBLE NULL,
    soh     DOUBLE NULL,
    CONSTRAINT fk_measurements_pack_pack
        FOREIGN KEY (pack_id) REFERENCES battery_packs(id)
        ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX ix_measurements_pack_pack_ts ON measurements_pack(pack_id, ts);

-- ---------------------------------------------------------------------------
-- measurements_cell
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS measurements_cell (
    id        BIGINT AUTO_INCREMENT PRIMARY KEY,
    pack_id   INT NOT NULL,
    cell_id   INT NOT NULL,
    ts        DATETIME(6) NOT NULL,
    v_cell    DOUBLE NULL,
    t_cell    DOUBLE NULL,
    r_cell    DOUBLE NULL,
    balancing TINYINT(1) NOT NULL DEFAULT 0,
    CONSTRAINT fk_measurements_cell_pack
        FOREIGN KEY (pack_id) REFERENCES battery_packs(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_measurements_cell_cell
        FOREIGN KEY (cell_id) REFERENCES battery_cells(id)
        ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX ix_measurements_cell_pack_ts ON measurements_cell(pack_id, ts);
CREATE INDEX ix_measurements_cell_cell_ts ON measurements_cell(cell_id, ts);

-- ---------------------------------------------------------------------------
-- feature_artifacts
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS feature_artifacts (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    pack_id       INT NULL,
    cycle_id      INT NULL,
    artifact_type VARCHAR(32) NOT NULL,
    file_path     TEXT NOT NULL,
    file_sha256   VARCHAR(64) NULL,
    row_count     BIGINT NULL,
    columns_json  JSON NULL,
    created_at    DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_feature_artifacts_pack
        FOREIGN KEY (pack_id) REFERENCES battery_packs(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_feature_artifacts_cycle
        FOREIGN KEY (cycle_id) REFERENCES cycles(id)
        ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX ix_feature_artifacts_pack_id  ON feature_artifacts(pack_id);
CREATE INDEX ix_feature_artifacts_cycle_id ON feature_artifacts(cycle_id);
CREATE INDEX ix_feature_artifacts_type    ON feature_artifacts(artifact_type);

-- ---------------------------------------------------------------------------
-- inference_runs
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS inference_runs (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    pack_id    INT NULL,
    model_key  VARCHAR(64) NOT NULL,
    mode       VARCHAR(16) NOT NULL DEFAULT 'batch',
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_inference_runs_pack
        FOREIGN KEY (pack_id) REFERENCES battery_packs(id)
        ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX ix_inference_runs_pack_id   ON inference_runs(pack_id);
CREATE INDEX ix_inference_runs_model_key ON inference_runs(model_key);

-- ---------------------------------------------------------------------------
-- inference_results
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS inference_results (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    run_id          INT NOT NULL,
    pack_id         INT NULL,
    cycle_id        INT NULL,
    ts              DATETIME(6) NULL,
    soc_pred        DOUBLE NULL,
    soh_pred        DOUBLE NULL,
    rul_pred_cycles  DOUBLE NULL,
    sop_kw_pred     DOUBLE NULL,
    extra_json      JSON NULL,
    CONSTRAINT fk_inference_results_run
        FOREIGN KEY (run_id) REFERENCES inference_runs(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_inference_results_pack
        FOREIGN KEY (pack_id) REFERENCES battery_packs(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_inference_results_cycle
        FOREIGN KEY (cycle_id) REFERENCES cycles(id)
        ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX ix_inference_results_run_id   ON inference_results(run_id);
CREATE INDEX ix_inference_results_pack_ts  ON inference_results(pack_id, ts);

-- ---------------------------------------------------------------------------
-- safety_events
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS safety_events (
    id        BIGINT AUTO_INCREMENT PRIMARY KEY,
    pack_id   INT NOT NULL,
    ts        DATETIME(6) NOT NULL,
    level     VARCHAR(16) NOT NULL,
    code      VARCHAR(64) NOT NULL,
    message   TEXT NULL,
    data_json JSON NULL,
    CONSTRAINT fk_safety_events_pack
        FOREIGN KEY (pack_id) REFERENCES battery_packs(id)
        ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX ix_safety_events_pack_ts ON safety_events(pack_id, ts);
CREATE INDEX ix_safety_events_code   ON safety_events(code);

-- ---------------------------------------------------------------------------
-- thresholds
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS thresholds (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    `key`      VARCHAR(64) NOT NULL UNIQUE,
    value      DOUBLE NOT NULL,
    unit       VARCHAR(16) NULL,
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB;

CREATE INDEX ix_thresholds_key ON thresholds(`key`);

SET FOREIGN_KEY_CHECKS = 1;
