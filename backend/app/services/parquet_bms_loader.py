"""Load BMS-style real-time data from parquet files in backend/data."""

from __future__ import annotations

from pathlib import Path
from datetime import datetime

import pandas as pd

from app.core.config import settings
from app.schemas.bms_data import (
    CurrentDataResponse,
    CellData,
    DatasetInfo,
    DatasetsListResponse,
)


# Column name variants (parquet / notebook vs API)
COL_TIME = [
    "Time Stamp", "timestamp", "Timestamp", "time", "t",
    "Cycle", "Semicycle",
]
COL_VOLTAGE = [
    "Voltage", "voltage", "pack_voltage",
    "Voltage_Actual_Battery [V]", "Voltage_Avg_Cell [V]", "Voltage Average",
    "voltage_average", "VoltageAverage",
]
COL_CURRENT = [
    "Current", "current", "pack_current",
    "Current_Actual_Battery [A]", "Current Average", "current_average", "CurrentAverage",
]
COL_TEMP = [
    "Temperature", "temperature", "pack_temperature",
    "Temperature_IN_Chamber [degC]", "Temperature_OUT_Chamber [degC]",
]
COL_POWER = ["Power", "power"]
COL_CAPACITY = [
    "Capacity", "capacity", "soc",
    "SoC_Actual_Battery [percent]",
]
COL_V_AVG = [
    "Voltage Average", "voltage_average", "VoltageAverage",
    "Voltage_Avg_Cell [V]",
]
COL_I_AVG = [
    "Current Average", "current_average", "CurrentAverage",
    "Current_Actual_Battery [A]",
]
COL_P_AVG = ["Power Average", "power_average", "PowerAverage"]


def _pick_column(df: pd.DataFrame, candidates: list[str]) -> str | None:
    for c in candidates:
        if c in df.columns:
            return c
    return None


def _resolve_columns(df: pd.DataFrame) -> dict[str, str]:
    """Map logical names to actual column names in the parquet."""
    out = {}
    for logical, candidates in [
        ("time", COL_TIME),
        ("voltage", COL_VOLTAGE),
        ("current", COL_CURRENT),
        ("temperature", COL_TEMP),
        ("capacity", COL_CAPACITY),
        ("voltage_avg", COL_V_AVG),
        ("current_avg", COL_I_AVG),
    ]:
        col = _pick_column(df, candidates)
        if col is not None:
            out[logical] = col
    return out


def get_data_path() -> Path:
    return settings.data_path.resolve()


def list_parquet_datasets() -> DatasetsListResponse:
    """List all .parquet files in backend/data with row count and columns."""
    data_path = get_data_path()
    if not data_path.is_dir():
        return DatasetsListResponse(datasets=[])

    datasets: list[DatasetInfo] = []
    for p in sorted(data_path.glob("*.parquet")):
        try:
            df = pd.read_parquet(p)
            key = p.stem
            cols = list(df.columns)
            datasets.append(
                DatasetInfo(
                    key=key,
                    name=key.replace("_", " ").title(),
                    path=str(p.name),
                    rows=len(df),
                    columns=cols,
                )
            )
        except Exception:
            continue
    return DatasetsListResponse(datasets=datasets)


def load_parquet_frame(dataset_key: str) -> tuple[pd.DataFrame, dict[str, str]] | None:
    """Load a parquet file by key (filename stem). Returns (df, column_map) or None."""
    data_path = get_data_path()
    # Try exact stem first
    p = data_path / f"{dataset_key}.parquet"
    if not p.is_file():
        for f in data_path.glob("*.parquet"):
            if f.stem == dataset_key or dataset_key in f.stem:
                p = f
                break
        else:
            return None
    try:
        df = pd.read_parquet(p)
        col_map = _resolve_columns(df)
        return df, col_map
    except Exception:
        return None


def row_to_bms_snapshot(
    row: pd.Series,
    col_map: dict[str, str],
    row_index: int,
    dataset_key: str,
) -> CurrentDataResponse:
    """Convert one parquet row to BMS current-data response (single-cell pack)."""
    def get(key: str, default: float = 0.0) -> float:
        col = col_map.get(key)
        if col is None or col not in row:
            return default
        v = row[col]
        if pd.isna(v):
            return default
        return float(v)

    ts = get("time", float(row_index))
    # If time looks like seconds (numeric), use as index label
    if isinstance(ts, (int, float)) and ts == float(row_index):
        timestamp_str = f"row_{row_index}"
    else:
        try:
            timestamp_str = datetime.utcfromtimestamp(float(ts)).isoformat() + "Z"
        except (TypeError, ValueError, OSError):
            timestamp_str = str(ts)

    voltage = get("voltage") or get("voltage_avg")
    current = get("current") or get("current_avg")
    temp = get("temperature")
    capacity = get("capacity")
    # Capacity in notebook is 0–1; API pack_soc is often 0–100
    pack_soc = capacity * 100.0 if capacity <= 1.0 else capacity

    cell = CellData(
        cell_id="01",
        voltage=voltage,
        temperature=temp,
        current=current,
        soc=pack_soc,
        soh=100.0,
        is_active=True,
    )

    return CurrentDataResponse(
        timestamp=timestamp_str,
        pack_voltage=voltage,
        pack_current=current,
        pack_temperature=temp,
        ambient_temperature=temp,
        pack_soc=pack_soc,
        pack_soh=100.0,
        operation_mode="discharging" if current < 0 else "charging",
        cells=[cell],
        row_index=row_index,
        dataset_key=dataset_key,
    )


def get_current_from_parquet(
    dataset_key: str,
    row_index: int = 0,
) -> CurrentDataResponse | None:
    """
    Return BMS current snapshot for one row of a parquet dataset.
    Used for real-time simulation (playback by row index).
    """
    result = load_parquet_frame(dataset_key)
    if result is None:
        return None
    df, col_map = result
    if row_index < 0 or row_index >= len(df):
        row_index = min(max(0, row_index), len(df) - 1) if len(df) else 0
    if len(df) == 0:
        return None
    row = df.iloc[row_index]
    return row_to_bms_snapshot(row, col_map, row_index, dataset_key)


def get_first_available_dataset_key() -> str | None:
    """Return the key of the first parquet file in data_dir, for default current source."""
    resp = list_parquet_datasets()
    if not resp.datasets:
        return None
    return resp.datasets[0].key
