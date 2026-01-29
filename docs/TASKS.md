# AIML-BMS System — Implementation Tasks

**Project:** AI/ML Battery Management System with Digital Twin Pipeline  
**Execution order:** Phase 0 → 1 → 2 → …; code implementation starts after requirements/design/README are agreed.

---

## Phase 0 — Project Setup & Documentation

- [x] Create project folder `aiml-bms-system` with docs
- [x] Write `docs/REQUIREMENTS.md` (functional, non-functional, comparison table spec)
- [x] Write `docs/DESIGN.md` (pipeline, digital twin, UI/UX)
- [x] Write `docs/TASKS.md` (this file)
- [x] Write `README.md` (overview, setup, data prep, references)
- [ ] Add `.gitignore` (Python, Node, env, data/raw, artifacts)
- [ ] Create repo scaffold: `data/raw/`, `scripts/`, `apps/` or `backend/` and `frontend/` (or `apps/web/`)

---

## Phase 1 — Data Preparation

- [ ] Define unified schema for cycle/curve data (after preprocess)
- [ ] Implement `scripts/preprocess.py` entry point
  - [ ] MATR: load `.mat`, convert to unified format, write to `data/processed/` or equivalent
  - [ ] HUST: unzip, parse, convert
  - [ ] CALCE: unzip, parse CS2/CX2, convert (handle long runtime)
  - [ ] RWTH: unzip, parse, convert
  - [ ] SNL, UL_PUR, HNEI: read cycle_data/timeseries CSVs, convert
- [ ] Document folder layout and download links in README (data/raw per dataset)
- [ ] Add config (e.g. YAML) for dataset paths and flags
- [ ] Train–test split: Random and MATR-specific (and others as needed)

---

## Phase 2 — Feature & Label Extraction

- [ ] Feature extractor: incremental capacity, differential capacity, coulombic efficiency, etc.
- [ ] Label extractor: cycle life, SoH, cathode aging (or equivalents per dataset)
- [ ] Normalization: log scale, Z-score, smoothing (pluggable for models)
- [ ] Integration with unified data representation (output of Phase 1)

---

## Phase 3 — Model Training & Comparison Table

- [ ] Implement baseline: Dummy regressor
- [ ] Implement feature-based: “Variance”, “Discharge”, “Full” models
- [ ] Implement linear: Ridge, PCR, PLSR
- [ ] Implement Gaussian process, XGBoost
- [ ] Implement seed-sensitive (10 seeds): Random forest, MLP, CNN, LSTM, Transformer
- [ ] Single entry point or config-driven training (dataset × model)
- [ ] Output: comparison table (models × datasets) with error mean ± std for sensitive models
- [ ] Persist results (CSV/JSON/DB) and optional artifacts (checkpoints, plots)
- [ ] Reproducibility: fixed seeds, versioned dependencies (requirements.txt)

---

## Phase 4 — Backend API & Digital Twin Pipeline

- [ ] Backend app (e.g. FastAPI): health, config
- [ ] Endpoints: list datasets, list models, get comparison table, trigger training (optional async)
- [ ] Optional: ingest endpoint for cycle/telemetry data (digital twin)
- [ ] Optional: event-driven pre/post processing (cron or queue)
- [ ] Storage: runs metadata (SQLite/Postgres), large data (Parquet/CSV or S3-style)
- [ ] Documentation: API spec (OpenAPI)

---

## Phase 5 — Frontend Energy Dashboards

- [ ] Create frontend app (e.g. React + TypeScript, Vite)
- [ ] Shell: header (title, status, Start/Record, Generate Plot, Virtual Fuel Gauge, Config Wizard, Expert Mode, Preferences)
- [ ] Left nav: Fuel Gauge, BMS, Dashboard, Models, Twin, Database, Settings (align with ai-battery-bms where useful)
- [ ] **Monitoring** tab: Pack real-time status, SoC/SoH, remaining time, Learnings, Power, OT warnings, Limiting factor
- [ ] **Configuration** tab: Pack/cell config, load/save config, read/write to backend
- [ ] **Lifetime Log** tab: Historical cycles, degradation curves
- [ ] **Learnings Backup** tab: Export/backup of learned parameters
- [ ] **Training & Results** page: Dataset/model selection, run training, **comparison table** (models × datasets, mean±std), visualizations (metrics, actual vs predicted, feature importance)
- [ ] Theming: dark theme option, BMS-style layout
- [ ] Connect frontend to backend API (comparison table, config, optional live data)

---

## Phase 6 — Digital Twin Integration & Polish

- [ ] Virtual Fuel Gauge: SoC/SoH from model or simulated data
- [ ] Generate Plot: degradation curves, predictions from selected model/dataset
- [ ] Config Wizard: guided pack/cell configuration
- [ ] Preferences: theme, units, default dataset/model
- [ ] Help and tooltips for limits (min/max, resolution)
- [ ] Optional: AWS or cloud integration (ingest, storage, SageMaker) per DESIGN.md

---

## Definition of Done (MVP)

- [ ] Raw data (at least one dataset) → `scripts/preprocess.py` → unified data
- [ ] Training produces comparison table: models × datasets, error mean ± std for seed-sensitive models
- [ ] Backend serves comparison table and config
- [ ] Frontend: Monitoring, Configuration, Lifetime Log, Learnings Backup, Training & Results with comparison table and key visualizations
- [ ] README and docs describe setup, data prep, and references
