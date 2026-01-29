# AIML-BMS System — Requirements

**Project:** AI/ML Battery Management System with Digital Twin Pipeline  
**Goal:** Train battery lifetime prediction models from public datasets, produce a training-result comparison table (error mean ± std across seeds), and provide energy dashboards plus a digital twin pipeline.

---

## 1. Functional Requirements

### 1.1 Data Preparation

- **Supported datasets** (BatteryML-style):
  - **MATR** — Four batches of LFP/graphite cells (`.mat`); place in `data/raw/MATR/` and run `scripts/preprocess.py`.
  - **HUST** — 77 LFP cells, Mendeley Data; place `hust_data.zip` in `data/raw/HUST/`.
  - **CALCE** — CS2/CX2 series; place zip files in `data/raw/CALCE/` (CS2_33–38, CX2_16, CX2_33–38).
  - **RWTH** — Place `raw.zip` in `data/raw/RWTH/`.
  - **SNL, UL-PUR, HNEI** — Battery Archive; apply for access; place cycle_data and timeseries CSVs in `data/raw/SNL`, `data/raw/UL_PUR`, `data/raw/HNEI/`.
- **Preprocessing:** Single entry point `scripts/preprocess.py` to convert raw files into unified representations (cycle data, voltage–capacity curves, etc.).
- **Unified representations:** Anode/cathode metadata, charge/discharge curves, voltage–capacity curves, train–test split options (e.g. Random, MATR-specific).

### 1.2 Model Training & Comparison Table

- **Models to support (aligned with reference table):**
  - Baseline: Dummy regressor.
  - Feature-based: “Variance”, “Discharge”, “Full” models.
  - Linear: Ridge regression, PCR, PLSR.
  - Other: Gaussian process, XGBoost.
  - Sensitive to initialization (report mean ± std over seeds): Random forest, MLP, CNN, LSTM, Transformer.
- **Datasets as columns:** MATR1, MATR2, HUST, SNL, CLO, CRUH, CRUSH, MIX (or equivalent naming per actual dataset splits).
- **Output:** Training result comparison table where:
  - Each cell is error (e.g. cycle-life prediction error).
  - For deterministic/single-seed models: single value or “>1000” when applicable.
  - For seed-sensitive models: **error mean across ten seeds with standard deviation as subscript** (e.g. `168±9`, `102±94`).
- **Reproducibility:** Fixed seeds where applicable; ten seeds for RF, MLP, CNN, LSTM, Transformer.

### 1.3 Digital Twin Pipeline

- **Data ingestion:** Ingest battery/cycle data (from preprocessed datasets or simulated/streaming sources).
- **Storage:** Time-series and cycle-level storage (e.g. S3/Timestream-style or local equivalents for MVP).
- **Event-driven processing:** Pre/post processing (e.g. feature extraction, normalization) triggerable on new data or on demand.
- **Model generation & prediction:** Train or load models; run predictions (e.g. cycle life, SoH); optional integration with AWS-style services (SageMaker/Forecast/Lookout) or local equivalents.
- **Frontend & API:** Dashboards and APIs to view metrics, predictions, and visualizations for OEMs / EV owners or operators.

### 1.4 Frontend Energy Dashboards & Pages

- **Layout (BMS GUI–inspired):**
  - Top bar: connection status, Start/Record, Generate Plot, Virtual Fuel Gauge, Config Wizard, Expert Mode, Preferences.
  - Left nav: Fuel Gauge, BMS (and/or Dashboard, Models, Twin, etc.).
  - Main area: tabs — Monitoring, Configuration, Lifetime Log, Learnings Backup.
- **Monitoring:** Pack real-time status (voltage, current, status, ambient/pack temp); optional cell-level table; SoC/SoH/remaining time; Learnings; Power; OT warnings; Limiting factor / Cell ID.
- **Configuration:** Pack/cell configuration (series/parallel, limits, resistance, voltage/current/temperature limits); load/save config from file; read/write to “board” or digital twin backend.
- **Lifetime Log:** Historical degradation / cycle data.
- **Learnings Backup:** Stored learned parameters or model-related outputs.
- **Training & results:** Page(s) for dataset selection, model selection, run training, and **view training result comparison table** (models × datasets, mean ± std).
- **Visualization:** Plots for metrics, predictions (e.g. actual vs predicted), degradation curves, feature importance.

---

## 2. Non-Functional Requirements

- **Reproducibility:** Preprocessing and training reproducible via fixed seeds and versioned scripts.
- **Performance:** Preprocessing may take hours for CALCE (many files); long-running training jobs supportable via scripts or background workers.
- **Usability:** Dashboards usable without expert mode; expert mode for advanced config.
- **Security:** No secrets in repo; config via env or config files; safe handling of user-uploaded data if supported later.
- **Documentation:** README, DESIGN, TASKS, and data-prep instructions (dataset links, folder layout, preprocess steps) documented.

---

## 3. Reference Data: Training Result Table (Target Format)

| Models        | MATR1   | MATR2   | HUST    | SNL     | CLO     | CRUH    | CRUSH   | MIX     |
|---------------|---------|---------|---------|---------|---------|---------|---------|---------|
| Dummy regressor | 398   | 510     | 419     | 466     | 331     | 239     | 576     | 573     |
| "Variance" model | 136  | 211     | 398     | 360     | 179     | 118     | 506     | 521     |
| "Discharge" model | 329 | 149     | 322     | 267     | 143     | 76      | >1000   | >1000   |
| "Full" model  | 167     | >1000   | 335     | 433     | 138     | 93      | >1000   | 331     |
| Ridge regression | 116  | 184     | >1000   | 242     | 169     | 65      | >1000   | 372     |
| PCR           | 90      | 187     | 435     | 200     | 197     | 68      | 560     | 376     |
| PLSR          | 104     | 181     | 431     | 242     | 176     | 60      | 535     | 383     |
| Gaussian process | 154  | 224     | >1000   | 251     | 204     | 115     | >1000   | 573     |
| XGBoost       | 334     | 799     | 395     | 547     | 215     | 119     | 330     | 205     |
| Random forest | 168±9   | 233±7   | 368±7   | 532±25  | 192±2   | 81±1    | 416±5   | 197±0   |
| MLP           | 149±3   | 275±27  | 459±9   | 370±81  | 146±5   | 103±4   | 565±9   | 451±42  |
| CNN           | 102±94  | 228±104 | 465±75  | 924±267 | >1000   | 174±92  | 545±11  | 272±101 |
| LSTM          | 119±11  | 219±33  | 443±29  | 539±40  | 222±12  | 105±10  | 519±39  | 268±9   |
| Transformer   | 135±13  | 364±25  | 391±11  | 424±23  | 187±14  | 81±8    | 550±21  | 271±16  |

*For models sensitive to initialization, values are error mean across ten seeds with standard deviation as subscript.*

---

## 4. Out of Scope (Initial Release)

- Full AWS deployment (architecture is reference; MVP can be local or single-cloud later).
- Real hardware BMS read/write (digital twin and file-based config only for MVP).
- All Battery Archive cells; only supported folder layouts and preprocess script.
