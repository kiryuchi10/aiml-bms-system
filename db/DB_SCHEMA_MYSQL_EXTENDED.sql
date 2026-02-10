-- =========================================
-- Extended schema: alarm_evidence, explanations
-- Run AFTER DB_SCHEMA_MYSQL.sql (same DB: aimlbms)
-- =========================================
-- USE aimlbms;

-- Optional: allow acknowledging alarms (MySQL: run once manually if needed)
-- ALTER TABLE alarm_event ADD COLUMN acknowledged_at DATETIME(3) NULL;
-- ALTER TABLE alarm_event ADD COLUMN acknowledged_by VARCHAR(64) NULL;

-- -----------------------------
-- Alarm Evidence (rule + model)
-- -----------------------------
CREATE TABLE IF NOT EXISTS alarm_evidence (
  id            BIGINT AUTO_INCREMENT PRIMARY KEY,
  alarm_id      BIGINT NOT NULL,
  reason_type   ENUM('rule','model') NOT NULL,
  description   TEXT NULL,

  rule_id       VARCHAR(64) NULL,
  rule_json     JSON NULL,

  model_run_id  BIGINT NULL,
  model_name    VARCHAR(64) NULL,
  anomaly_score DOUBLE NULL,
  anomaly_threshold DOUBLE NULL,
  top_features  JSON NULL,

  created_at    DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),

  INDEX idx_evidence_alarm (alarm_id),
  CONSTRAINT fk_evidence_alarm
    FOREIGN KEY (alarm_id) REFERENCES alarm_event(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_evidence_ml_run
    FOREIGN KEY (model_run_id) REFERENCES ml_run(id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------
-- Explanations (XAI / run or alarm)
-- -----------------------------
CREATE TABLE IF NOT EXISTS explanations (
  explain_id      VARCHAR(64) PRIMARY KEY,
  run_id          BIGINT NULL,
  alarm_id        BIGINT NULL,
  method          VARCHAR(32) NOT NULL,
  input_snapshot  JSON NOT NULL,
  output_snapshot JSON NOT NULL,
  attributions    JSON NULL,
  notes           TEXT NULL,
  created_at      DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),

  INDEX idx_explain_run (run_id),
  INDEX idx_explain_alarm (alarm_id),
  CONSTRAINT fk_explain_run
    FOREIGN KEY (run_id) REFERENCES ml_run(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_explain_alarm
    FOREIGN KEY (alarm_id) REFERENCES alarm_event(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
