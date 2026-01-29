# AIML-BMS System — Design

**Project:** AI/ML Battery Management System with Digital Twin Pipeline  
**References:** BatteryML-style pipeline, AWS Battery Digital Twin guidance, BMS GUI layout (MBM16S-P50-B style).

---

## 1. High-Level Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────────┐
│  Raw Datasets   │────▶│  Data Handler   │────▶│  Pipeline Input     │
│  MATR,HUST,...  │     │  Preprocess     │     │  Unified Repr.       │
└─────────────────┘     └──────────────────┘     │  Train/Test Split   │
                                                  └──────────┬──────────┘
                                                             │
         ┌──────────────────────────────────────────────────┼──────────────────────────────────────────────────┐
         │                                                  ▼                                                  │
         │  ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐     │
         │  │ Feature         │────▶│ Normalization   │────▶│ Models          │────▶│ Pipeline Output │     │
         │  │ Extractor       │     │ (Log,Z-score,…) │     │ (Ridge,RF,MLP,…) │     │ Metrics, Plots  │     │
         │  └─────────────────┘     └─────────────────┘     └─────────────────┘     └────────┬────────┘     │
         │           ▲                         ▲                    ▲                        │              │
         │           │                         │                    │                        ▼              │
         │  ┌────────┴────────┐     ┌──────────┴────────┐  ┌────────┴────────┐     ┌─────────────────┐     │
         │  │ Label Extractor │     │ Unified Data Repr.│  │ Labels          │     │ Frontend / API  │     │
         │  │ (Cycle life,…)  │     └───────────────────┘  └─────────────────┘     │ Dashboards       │     │
         │  └─────────────────┘                                                   └─────────────────┘     │
         └──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

- **Data Handler:** Raw → converted cycle/curve data (preprocess.py).
- **Pipeline Input:** Config, unified representations, train–test split (Random, MATR, etc.).
- **Feature / Label Extractors:** Incremental/differential capacity, coulombic efficiency, etc.; cycle life, SoH, aging labels.
- **Normalization:** Log scale, Z-score, smoothing (and optional model-specific).
- **Models:** Dummy, Variance/Discharge/Full, Ridge, PCR, PLSR, GP, XGBoost, RF, MLP, CNN, LSTM, Transformer.
- **Pipeline Output:** Comparison table (mean ± std), metrics, predictions, visualizations, feature importance.
- **Frontend/API:** Energy dashboards and digital twin UI consume this output and optional live/simulated data.

---

## 2. Digital Twin Pipeline (AWS Guidance–Aligned)

Conceptual mapping to “guidance for battery digital twin on AWS”:

| Layer                      | AWS Reference                    | MVP / Local Equivalent                    |
|----------------------------|----------------------------------|-------------------------------------------|
| Data sources               | Vehicle platform, IoT rules     | Preprocessed datasets, CSV/Parquet files  |
| Ingestion                  | IoT Core, FleetWise, Flink, Lambda | Scripts + optional message queue/worker   |
| Storage                    | Timestream, S3, DynamoDB        | Local/cloud: time-series DB, object store, SQLite/Postgres |
| Event-driven processing    | Glue, EventBridge, Lambda       | Preprocess + feature jobs (cron/CLI)      |
| Model generation & prediction | Forecast, Lookout, SageMaker  | Local training scripts + optional SageMaker/containers |
| Frontend & API             | Amplify, API Gateway, AppSync   | React/Vite app + REST or GraphQL API      |
| Consumers                  | OEMs, EV owners                 | Web dashboards, config UI                  |

- **MVP:** Implement pipeline stages as scripts + backend API + frontend; cloud services can replace local components in a later phase.
- **Data flow:** Raw → preprocess → stored unified data → feature/label extraction → train/evaluate → persist comparison table & artifacts → serve via API and dashboards.

---

## 3. UI/UX Layout (BMS GUI–Inspired)

Reference: MBM16S-P50-B GUI — Fuel Gauge, BMS, Monitoring, Configuration, Lifetime Log, Learnings.

### 3.1 Shell

- **Header:** App title (e.g. “AIML-BMS Digital Twin”); status (Connected/Disconnected); actions: Start, Record, Generate Plot, Virtual Fuel Gauge, Open Config Wizard, Expert Mode toggle, Preferences.
- **Left sidebar:** Primary nav — Fuel Gauge (SoC/SoH view), BMS (monitoring/config), Dashboard, Models, Twin, Database, Settings (align with ai-battery-bms patterns where useful).
- **Main content:** Tabbed — Monitoring | Configuration | Lifetime Log | Learnings Backup; plus Training/Results for model comparison table.

### 3.2 Monitoring Tab

- **Pack real-time status:** Pack voltage, current, status (Charge/Discharge), ambient temp, pack temp.
- **State:** SoC, SoH, remaining time (to empty / to full).
- **Optional:** Cell-level table (voltage, current, SoC, SoH, ESR).
- **Learnings:** CC charger current, avg load current, charger/load end current, CV charger voltage, heat transfer coef.
- **Power:** Measured, max discharge, max charge.
- **OT warnings, Limiting factor / Cell ID.**

### 3.3 Configuration Tab

- **Profile:** Cell type, nominal capacity.
- **Pack:** Series/parallel count, voltage/current/temperature limits, resistances.
- **Actions:** Load/Save config from file, Read/Write config to backend (digital twin).

### 3.4 Lifetime Log & Learnings Backup

- **Lifetime Log:** Historical cycles, degradation curves.
- **Learnings Backup:** Export/backup of learned parameters or model outputs.

### 3.5 Training & Results

- **Dataset selection:** MATR, HUST, CALCE, RWTH, SNL, UL-PUR, HNEI (or subsets).
- **Model selection:** Checkboxes or multi-select for models in the comparison table.
- **Run training:** Trigger pipeline (or link to script runs); show progress.
- **Comparison table:** Models × Datasets, cell values = error (single value or mean±std); “>1000” where applicable.
- **Visualizations:** Metrics (e.g. box/bar), actual vs predicted scatter, degradation curves, feature importance.

### 3.6 Theming & Accessibility

- Dark theme option (BMS-style); clear hierarchy (headers, cards, tables).
- Labels and units (V, A, °C, mAh, C-rate, mV).
- Tooltips for limits (e.g. min/max, resolution) where relevant.

---

## 4. Data Model (Simplified)

- **Cycle:** cycle_index, capacity, voltage curve, current, temperature, dataset_id, cell_id.
- **Cell/Batch:** cell_id, dataset (MATR/HUST/…), metadata (chemistry, protocol).
- **Unified representation:** Standardized cycle/curve schema for all datasets after preprocess.
- **Training run:** run_id, dataset_ids, model_name, seed(s), metrics (e.g. error per dataset), timestamp.
- **Comparison table:** Derived view: models × datasets → error mean, error std, or “>1000”.

---

## 5. Technology Suggestions (MVP)

- **Backend:** Python 3.10+; FastAPI for API; pandas/numpy for data; scikit-learn, XGBoost, PyTorch/TF for models.
- **Preprocess:** Single `scripts/preprocess.py`; optional config (e.g. YAML) for paths and dataset flags.
- **Frontend:** React + TypeScript, Vite; React Router; Tailwind CSS; charts (e.g. Recharts or similar).
- **State:** URL sync for selected pack/dataset/model; optional Zustand for UI state (see ai-battery-bms).
- **Storage:** SQLite or Postgres for runs/metadata; Parquet or CSV for large cycle/curve data; optional S3-compatible store.

---

## 6. References

- BatteryML-style pipeline: Data Handler → Pipeline Input → Feature/Label Extractors → Normalization → Models → Output.
- AWS: “Guidance for battery digital twin on AWS” (IoT, ingestion, storage, event-driven processing, model generation, frontend/API, consumers).
- BMS GUI: MBM16S-P50-B — Fuel Gauge, BMS, Monitoring, Configuration, Lifetime Log, Learnings; pack status, SoC/SoH, config wizard.
- ai-battery-bms: Dashboard, Packs, Events, Twin, Models, Database, Settings, SideNav, TopBar, KPI cards.
