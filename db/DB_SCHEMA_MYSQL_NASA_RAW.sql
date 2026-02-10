-- =========================================
-- NASA Battery Dataset - Raw Lab Schema
-- =========================================
-- 원본(raw) → 정제(clean) → 특징(features) → 예측(pred) 중
-- raw 계층: cells / cycles / samples
-- B0005, B0006, B0007, B0018 등 .mat 적재용.
-- 별도 DB 또는 동일 DB에 생성 후 ingest 스크립트로 적재.

-- CREATE DATABASE bms_nasa CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
-- USE bms_nasa;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS samples;
DROP TABLE IF EXISTS cycles;
DROP TABLE IF EXISTS cells;
SET FOREIGN_KEY_CHECKS = 1;

-- -----------------------------
-- (A) 메타 테이블 (셀/배터리 단위)
-- -----------------------------
CREATE TABLE IF NOT EXISTS cells (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  cell_code VARCHAR(32) NOT NULL UNIQUE,
  chemistry VARCHAR(32) NULL,
  note VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------
-- (B) 사이클 테이블 (cycle 단위)
-- -----------------------------
CREATE TABLE IF NOT EXISTS cycles (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  cell_id BIGINT NOT NULL,
  cycle_index INT NOT NULL,
  step_type ENUM('charge','discharge','impedance') NOT NULL,
  ambient_temp_c FLOAT NULL,
  started_at DATETIME NULL,
  ended_at DATETIME NULL,
  UNIQUE KEY uq_cycle (cell_id, cycle_index, step_type),
  INDEX idx_cell_cycle (cell_id, cycle_index),
  CONSTRAINT fk_cycles_cell FOREIGN KEY (cell_id) REFERENCES cells(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------
-- (C) 시계열 샘플 테이블 (핵심)
-- -----------------------------
CREATE TABLE IF NOT EXISTS samples (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  cycle_id BIGINT NOT NULL,
  t_s DOUBLE NOT NULL,
  v DOUBLE NULL,
  i DOUBLE NULL,
  temp_c DOUBLE NULL,
  cap_ah DOUBLE NULL,
  r_ohm DOUBLE NULL,
  INDEX idx_cycle_t (cycle_id, t_s),
  CONSTRAINT fk_samples_cycle FOREIGN KEY (cycle_id) REFERENCES cycles(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
