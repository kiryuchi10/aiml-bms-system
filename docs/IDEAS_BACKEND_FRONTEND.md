# Ideas to Implement: Data Pipeline & Deep Learning / ML (PyTorch)

This document lists **backend** and **frontend** ideas to advance the data pipeline and PyTorch-based ML/DL in the AIML-BMS system. Items are ordered by impact and dependency where relevant.

---

## What’s Already Done (Current Branch)

- **Data pipeline**
  - `app/pipelines/data_pipeline.py`: load parquet → normalize → train/val split, optional sequence length for sliding windows.
  - Reuses column resolution from `parquet_bms_loader` (voltage, current, temperature, capacity).
- **PyTorch**
  - `app/ml/dataset.py`: `BatteryDataset` (PyTorch `Dataset`) wrapping pipeline arrays.
  - `app/ml/models.py`: `MLPRegressor`, `Conv1DRegressor`, `build_model(model_key, ...)`.
  - `app/ml/trainer.py`: `run_training()`, `run_training_and_persist()` with DB (TrainingRun / TrainingResult).
- **API**
  - `POST /api/training/run`: body `dataset_key`, `model_key` (mlp | conv1d), `sequence_length`, `epochs`, `batch_size`, `val_ratio`, `seed` → run training and persist to DB.
  - `GET /api/training/runs`: list recent runs.
  - `GET /api/training/runs/{run_id}`: run detail + results.
- **Stack**
  - `requirements.txt`: added `torch`, `scikit-learn`.

---

## Backend Ideas

### Data pipeline

1. **Multiple targets**
   - Support targets: capacity, SOC, SOH proxy, cycle-life (if cycle-level data exists).
   - Pipeline: add `target_key` in API and allow per-dataset target selection.

2. **Feature config**
   - Allow user-defined feature sets (e.g. voltage + current only, or add derived: dV/dt, power).
   - Store feature list in config or request body and pass through `prepare_arrays`.

3. **Sequence length and stride**
   - Expose `sequence_length` and `stride` (e.g. non-overlapping vs overlapping windows) in pipeline and API.

4. **Multiple parquet files as one dataset**
   - “Virtual dataset”: combine several parquet files (e.g. multiple cells/runs) with same schema for larger train/val sets.
   - Pipeline: `get_ml_ready_multi(dataset_keys: list[str], ...)` that concatenates then splits.

5. **Normalization persistence**
   - Save mean/std (and y min/max) per run or per dataset to DB or JSON so inference uses the same scaling.
   - Optional: endpoint to return normalization constants for a given `dataset_key` or `run_id`.

6. **Downsampling and aggregation**
   - For long time series: resample (e.g. 1s → 10s) or aggregate (mean/max) before building windows to reduce size and training time.
   - Pipeline option: `resample_sec` or `aggregation` (mean/max).

7. **Train/val/test split**
   - Add test set (e.g. last 10% time-ordered) and return test metrics in training response and DB (e.g. extra columns or separate table).

8. **Data versioning**
   - Store checksum or version of parquet (or list of files + mtime) with each run so results are reproducible.

### PyTorch / ML

9. **More model architectures**
   - LSTM / GRU for sequence-to-one (SOC, SOH proxy).
   - Transformer or 1D Transformer for longer sequences.
   - Register models in `build_model` (e.g. `lstm`, `transformer`) with configurable hidden size, layers.

10. **Seed-sensitive training**
    - For selected models: run N seeds, store `error_mean` and `error_std` in `TrainingResult` (already in schema).
    - API: `num_seeds` in request; trainer loops and writes one result row with mean/std.

11. **Checkpointing and resume**
    - Save best checkpoint (by val loss) during training; optional endpoint to load checkpoint and run inference or resume training.
    - Store checkpoint path or blob reference in `TrainingRun` or new `model_artifacts` table.

12. **Learning rate scheduler**
    - Add CosineAnnealingLR or ReduceLROnPlateau in trainer; optional in request body.

13. **Early stopping**
    - Stop when val loss does not improve for K epochs; expose K in API.

14. **Export to ONNX**
    - After training, export model to ONNX and store path or blob; optional endpoint to download ONNX for deployment.

15. **Inference endpoint**
    - `POST /api/inference/predict`: body = run_id (or model path) + input array (or dataset_key + row indices) → return predictions (e.g. SOC, capacity).
    - Reuse same normalization as training (from stored constants or recomputed).

16. **Hyperparameter sweep**
    - Endpoint or script: run training for a grid of (lr, batch_size, hidden sizes); persist each run and return summary table (e.g. best run_id per dataset/model).

17. **SHAP / feature importance**
    - For MLP/linear: optional step after training to compute feature importance or SHAP values and attach to run (e.g. JSON in DB or file).
    - Endpoint: `GET /api/training/runs/{id}/explain` → feature importance or SHAP.

### API and services

18. **Async training**
    - Run training in background (Celery, FastAPI background task, or separate worker); return `run_id` immediately; poll `GET /api/training/runs/{id}` for status (pending/running/completed/failed).
    - Add `status` transitions: pending → running → completed (and store failure reason if failed).

19. **Training queue**
    - Queue multiple run requests; worker processes one at a time (or N in parallel) and updates DB.

20. **List datasets with ML readiness**
    - `GET /api/datasets/ml-ready`: for each parquet, call `get_ml_ready` (or lightweight check) and return which have enough rows and required columns.
    - Frontend can disable “Train” for non-ready datasets.

21. **Comparison table from DB**
    - `GET /api/results/comparison?run_id=...` (or latest run): build models × datasets table from `TrainingResult` (same shape as reference table) for frontend.

22. **Health check for PyTorch**
    - `GET /api/health` or `/api/training/status`: report whether `torch` is available and optionally CUDA.

---

## Frontend Ideas

### Training and runs

23. **Trigger training from UI**
    - Form: dataset (dropdown from `/api/datasets`), model (mlp / conv1d), epochs, batch size, sequence length, seed.
    - On submit: `POST /api/training/run`; show success with `run_id` or error (e.g. “PyTorch not installed”, “dataset too small”).

24. **List training runs**
    - Page or section: table of runs from `GET /api/training/runs` (id, status, created_at); link to run detail.

25. **Run detail page**
    - `GET /api/training/runs/{id}`: show status, created_at, table of results (dataset_key, model_key, error_value, error_mean, error_std).
    - Optional: small chart of train/val loss if backend exposes it (e.g. in run detail response or separate endpoint).

26. **Comparison table (from DB runs)**
    - Reuse existing “Training Results” table UI: fetch from `GET /api/results/comparison?run_id=X` (or latest) so the table shows DB-backed runs instead of only reference CSV.
    - Toggle or dropdown: “Reference” vs “Run #123”.

### Data and pipeline

27. **Dataset selector with ML readiness**
    - Use `GET /api/datasets/ml-ready` (when available) to show badge or tooltip “ML-ready” / “Too small” next to each dataset in dropdowns.

28. **Preview pipeline output**
    - Optional: “Preview” button that calls a new endpoint (e.g. `GET /api/pipeline/preview?dataset_key=X&sequence_length=5`) returning sample X/y shape and maybe a short summary (min/max, nulls). Show in modal or sidebar.

29. **Visualize training data**
    - Simple chart: for selected dataset, show voltage/current/temperature (and target) over time (first N rows) using existing or new endpoint that returns time series slice.
    - Helps users sanity-check data before training.

### Plots and analytics

30. **Train/val loss curve**
    - If backend stores per-epoch train/val loss, add endpoint and frontend line chart (epoch vs loss).
    - Optional: MAE/MSE on same chart.

31. **Predictions vs actual**
    - If inference endpoint exists: for a chosen run and dataset (or row range), get predictions and plot “actual vs predicted” (scatter or line).
    - Backend: either in-memory inference for requested rows or cached predictions per run.

32. **Feature importance / SHAP**
    - If backend exposes `GET /api/training/runs/{id}/explain`: show bar chart or table of feature importance on run detail page.

### UX and robustness

33. **Loading and error states**
    - For all training and run endpoints: loading spinners, error toasts, empty states (“No runs yet”, “No parquet files”).

34. **Polling for async runs**
    - When training is async: after POST, show “Run #123 – Pending”; poll `GET /api/training/runs/123` until status is completed/failed; then refresh results and optionally notify.

35. **Download artifacts**
    - If backend stores ONNX or CSV of results: “Download ONNX” / “Download results CSV” buttons on run detail page.

36. **Responsive tables**
    - Training runs and comparison tables: sortable columns, optional pagination if list grows.

---

## Suggested Order of Implementation

- **Quick wins (backend):** (20) ML-ready datasets, (21) comparison table from DB, (22) PyTorch health.
- **Quick wins (frontend):** (23) Trigger training form, (24) List runs, (25) Run detail, (26) Comparison table from DB.
- **Next (backend):** (9) LSTM/Transformer, (10) seed-sensitive runs, (18) async training, (15) inference endpoint.
- **Next (frontend):** (27) ML-ready badges, (30) loss curve, (33)–(34) loading/polling.
- **Later:** (4)–(8) pipeline enhancements, (11)–(17) advanced ML, (28)–(29), (31)–(32), (35)–(36).

Use this list to pick the next tasks for the data pipeline and PyTorch-based ML/DL on both backend and frontend.
