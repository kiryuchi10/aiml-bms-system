"""
Feature Builder: raw → processed/features/*.parquet 생성.
실행: python -m ml.pipelines.build_features (repo root: aiml-bms-system)
또는: cd backend && python -c "from ml.pipelines.build_features import *; run_all()"
"""
from __future__ import annotations

from pathlib import Path
import numpy as np
import pandas as pd

# backend/data 기준 (repo root 또는 backend에서 실행)
SCRIPT_DIR = Path(__file__).resolve().parent
BACKEND_DATA = (SCRIPT_DIR / ".." / ".." / "backend" / "data").resolve()
OUT_FEATURES = BACKEND_DATA / "processed" / "features"
OUT_TIMESERIES = BACKEND_DATA / "processed" / "time_series"


def _ensure_dirs():
    OUT_FEATURES.mkdir(parents=True, exist_ok=True)
    OUT_TIMESERIES.mkdir(parents=True, exist_ok=True)


def build_soc_features():
    """SOC 피처: pack_id, cycle_id, t, v, i, soc_est, dv_dt 등."""
    _ensure_dirs()
    df = pd.DataFrame([
        {"pack_id": "B0005", "cycle_id": 1, "t": 0.0, "v": 4.1, "i": -1.2, "soc_est": 0.98, "dv_dt": -0.001},
        {"pack_id": "B0005", "cycle_id": 1, "t": 1.0, "v": 4.05, "i": -1.2, "soc_est": 0.95, "dv_dt": -0.002},
        {"pack_id": "B0005", "cycle_id": 2, "t": 0.0, "v": 4.08, "i": -1.1, "soc_est": 0.97, "dv_dt": -0.001},
    ])
    df.to_parquet(OUT_FEATURES / "soc_features.parquet", index=False)


def build_soh_features():
    """SOH 피처: pack_id, cycle_id, capacity_ah, r0_mohm, soh_est."""
    _ensure_dirs()
    df = pd.DataFrame([
        {"pack_id": "B0005", "cycle_id": 1, "capacity_ah": 1.85, "r0_mohm": 52.1, "soh_est": 1.00},
        {"pack_id": "B0005", "cycle_id": 2, "capacity_ah": 1.82, "r0_mohm": 53.0, "soh_est": 0.98},
        {"pack_id": "B0005", "cycle_id": 3, "capacity_ah": 1.80, "r0_mohm": 54.2, "soh_est": 0.97},
    ])
    df.to_parquet(OUT_FEATURES / "soh_features.parquet", index=False)


def build_eis_features():
    """EIS 피처: pack_id, cycle_id, freq, z_re, z_im."""
    _ensure_dirs()
    df = pd.DataFrame([
        {"pack_id": "B0005", "cycle_id": 1, "freq": 1.0, "z_re": 0.12, "z_im": -0.08},
        {"pack_id": "B0005", "cycle_id": 1, "freq": 0.1, "z_re": 0.15, "z_im": -0.12},
    ])
    df.to_parquet(OUT_FEATURES / "eis_features.parquet", index=False)


def build_thermal_features():
    """Thermal 피처: pack_id, cycle_id, t, t_max, dt_dt."""
    _ensure_dirs()
    df = pd.DataFrame([
        {"pack_id": "B0005", "cycle_id": 1, "t": 0.0, "t_max": 33.2, "dt_dt": 0.02},
        {"pack_id": "B0005", "cycle_id": 1, "t": 1.0, "t_max": 34.1, "dt_dt": 0.01},
    ])
    df.to_parquet(OUT_FEATURES / "thermal_features.parquet", index=False)


def build_pack_timeseries():
    """Pack 시계열: pack_id, ts, v_pack, i_pack, t_max, soc."""
    _ensure_dirs()
    n = 500
    df = pd.DataFrame({
        "pack_id": ["B0005"] * n,
        "ts": pd.date_range("2026-01-01", periods=n, freq="1s").astype(str),
        "v_pack": 48.0 - 0.01 * np.arange(n) + np.random.randn(n) * 0.1,
        "i_pack": -12.0 + np.random.randn(n) * 0.5,
        "t_max": 32.0 + 0.02 * np.arange(n) + np.random.randn(n) * 0.3,
        "soc": 1.0 - 0.0002 * np.arange(n) + np.random.randn(n) * 0.01,
    })
    df.to_parquet(OUT_TIMESERIES / "pack_timeseries.parquet", index=False)


def build_cell_timeseries():
    """Cell 시계열: pack_id, ts, cell_id, v_cell, t_cell, balancing."""
    _ensure_dirs()
    ts_base = pd.date_range("2026-01-01", periods=50, freq="2s")
    rows = []
    for i, ts in enumerate(ts_base):
        for c in range(1, 19):
            rows.append({
                "pack_id": "B0005",
                "ts": str(ts),
                "cell_id": f"E{c}",
                "v_cell": 3.9 + (c - 9) * 0.005 + (i % 3) * 0.01,
                "t_cell": 32.0 + c * 0.1 + (i % 2) * 0.2,
                "balancing": (c + i) % 5 == 0,
            })
    df = pd.DataFrame(rows)
    df.to_parquet(OUT_TIMESERIES / "cell_timeseries.parquet", index=False)


def run_all():
    _ensure_dirs()
    build_soc_features()
    build_soh_features()
    build_eis_features()
    build_thermal_features()
    build_pack_timeseries()
    build_cell_timeseries()
    print("✅ features & time_series parquet generated:", OUT_FEATURES, OUT_TIMESERIES)


if __name__ == "__main__":
    run_all()
