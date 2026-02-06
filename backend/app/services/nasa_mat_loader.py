"""
Load NASA .mat (B0005, B0006, B0007, B0018) for dashboard/WS replay.
Single-cell .mat data is expanded to 20-cell grid (noise + status rules) for UI demo.
"""

from __future__ import annotations

import random
from pathlib import Path
from typing import Any

from app.core.config import settings
from app.schemas.bms_data import CurrentDataResponse, CellData

# Reuse parse logic from pipeline
from app.pipelines.nasa.parse_mat import _get_mat_data, _extract_cycle_array, _row_count, _safe_float

import numpy as np

N_CELLS_UI = 20
VOLTAGE_OV = 4.25
VOLTAGE_UV = 2.50
TEMP_OT = 55.0
TEMP_UT = -10.0
IMBALANCE_MV = 150.0


def get_data_path() -> Path:
    return settings.data_path.resolve()


def list_mat_datasets() -> list[str]:
    """Return list of .mat dataset keys (filename stems) in data_dir."""
    data_path = get_data_path()
    if not data_path.is_dir():
        return []
    return [p.stem for p in sorted(data_path.glob("*.mat"))]


def _load_mat_rows(mat_path: Path) -> list[dict[str, Any]]:
    """Load .mat and return list of row dicts (one per time point): voltage, current, temperature, (soc)."""
    mat = _get_mat_data(mat_path)
    cycles = _extract_cycle_array(mat)
    if cycles is None:
        return []
    if not hasattr(cycles, "__len__"):
        cycles = [cycles]
    rows: list[dict[str, Any]] = []
    for cycle in cycles:
        if not hasattr(cycle, "data"):
            continue
        data = cycle.data
        if data is None:
            continue
        n = _row_count(data)
        time_arr = getattr(data, "Time", None)
        if time_arr is not None:
            time_arr = np.asarray(time_arr).flatten()
        v_arr = getattr(data, "Voltage_measured", None)
        if v_arr is not None:
            v_arr = np.asarray(v_arr).flatten()
        i_arr = getattr(data, "Current_measured", None)
        if i_arr is not None:
            i_arr = np.asarray(i_arr).flatten()
        t_arr = getattr(data, "Temperature_measured", None)
        if t_arr is not None:
            t_arr = np.asarray(t_arr).flatten()
        for i in range(n):
            voltage = _safe_float(v_arr, i)
            current = _safe_float(i_arr, i)
            temperature = _safe_float(t_arr, i)
            rows.append({
                "voltage": voltage,
                "current": current,
                "temperature": temperature,
                "soc": None,
            })
    return rows


def _expand_to_cells(row: dict[str, Any], seed: int = 0) -> tuple[float, float, float, float, list[CellData]]:
    """
    Expand single-cell row to N_CELLS_UI cells with noise; return pack_voltage, pack_current, pack_temp, pack_soc, cells.
    """
    rng = random.Random(seed)
    v0 = row.get("voltage") or 0.0
    i0 = row.get("current") or 0.0
    t0 = row.get("temperature") or 25.0
    soc0 = row.get("soc")
    if soc0 is None:
        soc0 = max(0, min(1, (v0 - 2.5) / 1.5)) if v0 else 0.5  # crude SOC proxy
    cells: list[CellData] = []
    vs: list[float] = []
    v_per_cell = v0 / N_CELLS_UI if N_CELLS_UI else v0
    for i in range(1, N_CELLS_UI + 1):
        noise_v = (rng.random() - 0.5) * 0.02 * (v_per_cell or 1)
        noise_t = (rng.random() - 0.5) * 2.0
        v = max(2.0, min(4.3, v_per_cell + noise_v))
        t = t0 + noise_t
        vs.append(v)
        status = "normal"
        if v >= VOLTAGE_OV:
            status = "ov"
        elif v <= VOLTAGE_UV:
            status = "uv"
        if t >= TEMP_OT:
            status = "ot" if status == "normal" else status
        elif t <= TEMP_UT:
            status = "ut" if status == "normal" else status
        cells.append(CellData(
            cell_id=f"{i:02d}",
            voltage=round(v, 4),
            temperature=round(t, 2),
            current=round(i0 / N_CELLS_UI, 4),
            soc=soc0 * 100.0 if soc0 <= 1 else soc0,
            soh=100.0,
            is_active=True,
        ))
    if vs:
        v_min, v_max = min(vs), max(vs)
        if (v_max - v_min) * 1000 >= IMBALANCE_MV:
            for c in cells:
                if c.voltage == v_max or c.voltage == v_min:
                    if c.voltage == v_max or c.voltage == v_min:
                        pass  # could set a flag; CellData has no status, leave as is
                    break
    pack_v = sum(vs) if vs else v0
    pack_i = i0
    pack_t = sum(c.temperature for c in cells) / len(cells) if cells else t0
    pack_soc = soc0 * 100.0 if soc0 <= 1 else soc0
    return pack_v, pack_i, pack_t, pack_soc, cells


# In-memory cache: dataset_key -> list of row dicts (from .mat)
_mat_cache: dict[str, list[dict[str, Any]]] = {}


def _get_mat_rows(dataset_key: str) -> list[dict[str, Any]] | None:
    data_path = get_data_path()
    p = data_path / f"{dataset_key}.mat"
    if not p.is_file():
        for f in data_path.glob("*.mat"):
            if f.stem == dataset_key:
                p = f
                break
        else:
            return None
    if dataset_key not in _mat_cache:
        rows = _load_mat_rows(p)
        _mat_cache[dataset_key] = rows
    return _mat_cache[dataset_key]


def get_current_from_mat(
    dataset_key: str,
    row_index: int = 0,
) -> CurrentDataResponse | None:
    """
    Return BMS snapshot for one row of a .mat dataset (single-cell expanded to 20 cells).
    Compatible with get_current_from_parquet for dashboard/WS.
    """
    rows = _get_mat_rows(dataset_key)
    if not rows:
        return None
    if row_index < 0 or row_index >= len(rows):
        row_index = row_index % len(rows) if len(rows) else 0
    row = rows[row_index]
    pack_v, pack_i, pack_t, pack_soc, cells = _expand_to_cells(row, seed=row_index)
    timestamp_str = f"row_{row_index}"
    return CurrentDataResponse(
        timestamp=timestamp_str,
        pack_voltage=round(pack_v, 4),
        pack_current=round(pack_i, 4),
        pack_temperature=round(pack_t, 2),
        ambient_temperature=round(pack_t, 2),
        pack_soc=round(pack_soc, 2),
        pack_soh=100.0,
        operation_mode="discharging" if pack_i < 0 else "charging",
        cells=cells,
        row_index=row_index,
        dataset_key=dataset_key,
    )


def get_first_available_mat_key() -> str | None:
    """First .mat dataset key in data_dir (for fallback when no parquet)."""
    keys = list_mat_datasets()
    return keys[0] if keys else None


def has_mat_data(dataset_key: str) -> bool:
    rows = _get_mat_rows(dataset_key)
    return rows is not None and len(rows) > 0


def get_mat_row_count(dataset_key: str) -> int:
    """Number of time rows in .mat dataset (for WS total_rows)."""
    rows = _get_mat_rows(dataset_key)
    return len(rows) if rows else 0
