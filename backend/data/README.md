# Backend data directory (DATA_DIR)

Place WLTP and NASA BMS files here so the API and WebSocket use real data (no mock).

## From WLTP_Driving_cycle_reference.zip

Extract the zip and copy these into this folder:

- **B0005.mat**, **B0006.mat**, **B0007.mat**, **B0018.mat** — NASA PCoE raw; used by `/ws/bms` and dashboard when no parquet is chosen.
- **pack_timeseries.parquet** — pack-level time series (V, I, T, SoC).
- **cell_timeseries.parquet** — cell-level time series.
- **soh_features.parquet** — SoH features (e.g. cycle, soh_actual, soh_pred, anomaly_score) for SoH trend and anomaly APIs.
- **soc_features.parquet**, **thermal_features.parquet**, **eis_features.parquet** — for analytics and future ML.

See **docs/DATA_LAYOUT_WLTP.md** for roles and loading order.
