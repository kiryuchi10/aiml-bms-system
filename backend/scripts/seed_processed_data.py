"""
Seed data/processed/features and data/processed/time_series with minimal parquet
so pack/cells/timeseries/features API return data. Run from backend/: python scripts/seed_processed_data.py
"""
from pathlib import Path
import sys

BACKEND_DIR = Path(__file__).resolve().parent.parent
DATA = BACKEND_DIR / "data" / "processed"
FEATURES = DATA / "features"
TIMESERIES = DATA / "time_series"


def main():
    import pandas as pd
    import numpy as np

    FEATURES.mkdir(parents=True, exist_ok=True)
    TIMESERIES.mkdir(parents=True, exist_ok=True)

    pd.DataFrame([
        {"pack_id": "B0005", "cycle_id": 1, "t": 0.0, "v": 4.1, "i": -1.2, "soc_est": 0.98, "dv_dt": -0.001},
        {"pack_id": "B0005", "cycle_id": 1, "t": 1.0, "v": 4.05, "i": -1.2, "soc_est": 0.95, "dv_dt": -0.002},
    ]).to_parquet(FEATURES / "soc_features.parquet", index=False)

    pd.DataFrame([
        {"pack_id": "B0005", "cycle_id": 1, "capacity_ah": 1.85, "r0_mohm": 52.1, "soh_est": 1.00},
        {"pack_id": "B0005", "cycle_id": 2, "capacity_ah": 1.82, "r0_mohm": 53.0, "soh_est": 0.98},
    ]).to_parquet(FEATURES / "soh_features.parquet", index=False)

    pd.DataFrame([
        {"pack_id": "B0005", "cycle_id": 1, "freq": 1.0, "z_re": 0.12, "z_im": -0.08},
    ]).to_parquet(FEATURES / "eis_features.parquet", index=False)

    pd.DataFrame([
        {"pack_id": "B0005", "cycle_id": 1, "t": 0.0, "t_max": 33.2, "dt_dt": 0.02},
    ]).to_parquet(FEATURES / "thermal_features.parquet", index=False)

    n = 300
    pd.DataFrame({
        "pack_id": ["B0005"] * n,
        "ts": pd.date_range("2026-01-01", periods=n, freq="1s").astype(str),
        "v_pack": 48.0 - 0.01 * np.arange(n) + np.random.randn(n) * 0.1,
        "i_pack": -12.0 + np.random.randn(n) * 0.5,
        "t_max": 32.0 + 0.02 * np.arange(n) + np.random.randn(n) * 0.3,
        "soc": np.clip(1.0 - 0.0002 * np.arange(n) + np.random.randn(n) * 0.01, 0, 1),
    }).to_parquet(TIMESERIES / "pack_timeseries.parquet", index=False)

    ts_base = pd.date_range("2026-01-01", periods=30, freq="2s")
    rows = []
    for i, ts in enumerate(ts_base):
        for c in range(1, 19):
            rows.append({
                "pack_id": "B0005", "ts": str(ts), "cell_id": f"E{c}",
                "v_cell": 3.9 + (c - 9) * 0.005 + (i % 3) * 0.01,
                "t_cell": 32.0 + c * 0.1, "balancing": (c + i) % 5 == 0,
            })
    pd.DataFrame(rows).to_parquet(TIMESERIES / "cell_timeseries.parquet", index=False)

    print("OK Seed parquet written to", DATA)


if __name__ == "__main__":
    main()
