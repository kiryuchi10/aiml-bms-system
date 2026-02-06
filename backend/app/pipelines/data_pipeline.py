"""
Data pipeline for ML: load parquet, normalize columns, produce train/val arrays
for PyTorch (or sklearn). Reuses column resolution from parquet_bms_loader.
"""

from __future__ import annotations

from typing import NamedTuple

import numpy as np
import pandas as pd

from app.services.parquet_bms_loader import load_parquet_frame

# Feature columns we want for input (V, I, T)
FEATURE_KEYS = ["voltage", "current", "temperature"]
# Target: capacity/soc (0-1) or voltage as proxy
TARGET_KEYS = ["capacity", "voltage"]


def _get_col_map_keys(col_map: dict[str, str], keys: list[str]) -> list[str]:
    out = []
    for k in keys:
        if k in col_map:
            out.append(col_map[k])
    return out


def prepare_arrays(
    df: pd.DataFrame,
    col_map: dict[str, str],
    sequence_length: int = 1,
    val_ratio: float = 0.2,
    target_key: str = "capacity",
    seed: int | None = 42,
) -> tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
    """
    Build (X_train, y_train, X_val, y_val) from DataFrame and column map.
    - X: (n_samples, sequence_length, n_features) with features voltage, current, temperature.
    - y: (n_samples,) target (capacity or voltage).
    If sequence_length > 1, each sample is a sliding window of consecutive rows.
    """
    feat_cols = _get_col_map_keys(col_map, FEATURE_KEYS)
    if not feat_cols:
        raise ValueError("No feature columns found; need at least one of voltage/current/temperature")

    target_col = col_map.get(target_key)
    if target_col is None or target_col not in df.columns:
        target_col = col_map.get("voltage")  # fallback
    if target_col is None:
        raise ValueError("No target column (capacity or voltage) found")

    df_clean = df[feat_cols + [target_col]].dropna()
    if len(df_clean) < sequence_length + 1:
        raise ValueError(f"Not enough rows after dropna: need > {sequence_length}")

    F = len(feat_cols)
    n_windows = len(df_clean) - sequence_length
    X = np.zeros((n_windows, sequence_length, F), dtype=np.float32)
    y = np.zeros((n_windows,), dtype=np.float32)

    for i in range(n_windows):
        X[i] = df_clean.iloc[i : i + sequence_length][feat_cols].values
        y[i] = df_clean.iloc[i + sequence_length - 1][target_col]

    # Normalize: zero mean, unit var per feature (optional but recommended for NN)
    # Reshape for computing stats: (n_windows * sequence_length, F)
    X_flat = X.reshape(-1, F)
    mean = X_flat.mean(axis=0)
    std = X_flat.std(axis=0)
    std[std < 1e-8] = 1.0
    X = (X - mean) / std
    # Scale y to 0-1 if it looks like capacity/voltage
    y_min, y_max = y.min(), y.max()
    if y_max - y_min > 1e-8:
        y = (y - y_min) / (y_max - y_min)

    # Train/val split (time-based: first (1-val_ratio) train, rest val)
    n_train = int(n_windows * (1 - val_ratio))
    if seed is not None:
        rng = np.random.default_rng(seed)
        idx = np.arange(n_windows)
        rng.shuffle(idx)
        train_idx, val_idx = idx[:n_train], idx[n_train:]
    else:
        train_idx = np.arange(n_train)
        val_idx = np.arange(n_train, n_windows)

    return X[train_idx], y[train_idx], X[val_idx], y[val_idx]


class PipelineResult(NamedTuple):
    """Result of loading and preparing one dataset for ML."""

    X_train: np.ndarray
    y_train: np.ndarray
    X_val: np.ndarray
    y_val: np.ndarray
    n_features: int
    sequence_length: int
    dataset_key: str


def get_ml_ready(
    dataset_key: str,
    sequence_length: int = 1,
    val_ratio: float = 0.2,
    target_key: str = "capacity",
    seed: int | None = 42,
) -> PipelineResult | None:
    """
    Load parquet by dataset_key, prepare train/val arrays for PyTorch/sklearn.
    Returns None if dataset not found or too small.
    """
    result = load_parquet_frame(dataset_key)
    if result is None:
        return None
    df, col_map = result
    if len(df) < 10:
        return None
    try:
        X_train, y_train, X_val, y_val = prepare_arrays(
            df, col_map,
            sequence_length=sequence_length,
            val_ratio=val_ratio,
            target_key=target_key,
            seed=seed,
        )
    except (ValueError, KeyError):
        return None
    n_features = X_train.shape[2]
    return PipelineResult(
        X_train=X_train,
        y_train=y_train,
        X_val=X_val,
        y_val=y_val,
        n_features=n_features,
        sequence_length=sequence_length,
        dataset_key=dataset_key,
    )
