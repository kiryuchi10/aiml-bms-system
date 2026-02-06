"""
Ingest NASA PCoE .mat files (B0005, B0006, B0007, B0018) into telemetry_cell.
Maps cycle[i].data (Time, Voltage_measured, Current_measured, Temperature_measured)
to telemetry_cell rows. Append-only. vehicle_id=1, module_id=1, cell_id=1 by default.
"""

from __future__ import annotations

import argparse
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Any

import numpy as np

try:
    from scipy.io import loadmat
except ImportError:
    loadmat = None  # type: ignore


def _get_mat_data(path: Path) -> dict[str, Any]:
    if loadmat is None:
        raise RuntimeError("scipy is required for .mat: pip install scipy")
    return loadmat(str(path), struct_as_record=False, squeeze_me=True)


def _extract_cycle_array(mat: dict[str, Any]) -> Any:
    """Get cycle array from NASA .mat (key may be 'cycle' or nested)."""
    if "cycle" in mat:
        return mat["cycle"]
    # Some MAT files nest under a top-level key
    for key in mat:
        if key.startswith("__"):
            continue
        val = mat[key]
        if isinstance(val, np.ndarray) and val.dtype.names is not None and "type" in (val.dtype.names or []):
            return val
        if hasattr(val, "cycle"):
            return getattr(val, "cycle", val)
    return None


def _safe_float(arr: Any, idx: int, default: float = 0.0) -> float:
    if arr is None:
        return default
    try:
        if hasattr(arr, "flatten"):
            flat = np.asarray(arr).flatten()
            if idx < len(flat):
                return float(flat[idx])
        elif isinstance(arr, (list, tuple)) and idx < len(arr):
            return float(arr[idx])
    except (TypeError, ValueError, IndexError):
        pass
    return default


def _row_count(data: Any) -> int:
    """Number of rows in cycle data (Time or Voltage_measured length)."""
    if data is None:
        return 0
    for name in ["Time", "Voltage_measured", "Voltage_measured"]:
        if hasattr(data, name):
            arr = getattr(data, name)
            if arr is not None and hasattr(arr, "__len__"):
                return len(np.asarray(arr).flatten())
    return 0


def parse_and_yield_rows(
    mat_path: Path,
    vehicle_id: int = 1,
    module_id: int = 1,
    cell_id: int = 1,
    source_tag: str = "nasa_mat",
    base_ts: datetime | None = None,
) -> list[dict[str, Any]]:
    """
    Parse .mat and yield dicts suitable for telemetry_cell insert.
    Each row: vehicle_id, module_id, cell_id, ts, voltage, current, temperature, soc, balancing, source.
    """
    mat = _get_mat_data(mat_path)
    cycles = _extract_cycle_array(mat)
    if cycles is None:
        return []
    if not hasattr(cycles, "__len__"):
        cycles = [cycles]
    out: list[dict[str, Any]] = []
    # Base timestamp: use file stem + cycle index so ts is monotonic
    if base_ts is None:
        base_ts = datetime(2008, 1, 1, tzinfo=timezone.utc)
    total_seconds = 0.0
    for cy_idx, cycle in enumerate(cycles):
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
            t_sec = _safe_float(time_arr, i, 0.0)
            ts = base_ts + timedelta(seconds=total_seconds + t_sec)
            voltage = _safe_float(v_arr, i)
            current = _safe_float(i_arr, i)
            temperature = _safe_float(t_arr, i)
            # SOC proxy: optional Capacity column or None
            soc = None
            out.append({
                "vehicle_id": vehicle_id,
                "module_id": module_id,
                "cell_id": cell_id,
                "ts": ts,
                "voltage": voltage,
                "current": current,
                "temperature": temperature,
                "soc": soc,
                "balancing": False,
                "source": source_tag,
            })
        if time_arr is not None and len(time_arr) > 0:
            total_seconds += float(time_arr[-1]) if len(time_arr) > 0 else 0
    return out


def ingest_mat_to_db(
    mat_path: Path,
    vehicle_id: int = 1,
    module_id: int = 1,
    cell_id: int = 1,
    source_tag: str | None = None,
    db_session: Any = None,
    batch_size: int = 5000,
) -> int:
    """
    Load .mat and insert rows into telemetry_cell. Returns count inserted.
    """
    if db_session is None:
        from app.db.session import SessionLocal
        db = SessionLocal()
        try:
            return _ingest_with_session(mat_path, vehicle_id, module_id, cell_id, source_tag, db, batch_size)
        finally:
            db.close()
    return _ingest_with_session(mat_path, vehicle_id, module_id, cell_id, source_tag, db_session, batch_size)


def _ingest_with_session(
    mat_path: Path,
    vehicle_id: int,
    module_id: int,
    cell_id: int,
    source_tag: str | None,
    db: Any,
    batch_size: int,
) -> int:
    from app.models.vehicle import Vehicle
    from app.models.telemetry_bms import TelemetryCell

    tag = source_tag or f"nasa_mat_{mat_path.stem}"
    rows = parse_and_yield_rows(mat_path, vehicle_id=vehicle_id, module_id=module_id, cell_id=cell_id, source_tag=tag)
    if not rows:
        return 0
    # Ensure vehicle exists
    v = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not v:
        db.add(Vehicle(id=vehicle_id, name=f"Vehicle_{vehicle_id}", vin=f"VIN{vehicle_id}"))
        db.flush()
    inserted = 0
    for i in range(0, len(rows), batch_size):
        chunk = rows[i : i + batch_size]
        for r in chunk:
            db.add(TelemetryCell(
                vehicle_id=r["vehicle_id"],
                module_id=r["module_id"],
                cell_id=r["cell_id"],
                ts=r["ts"],
                voltage=r["voltage"],
                current=r["current"],
                temperature=r["temperature"],
                soc=r["soc"],
                balancing=r["balancing"],
                source=r["source"],
            ))
        inserted += len(chunk)
        db.commit()
    return inserted


def main() -> None:
    parser = argparse.ArgumentParser(description="Ingest NASA .mat into telemetry_cell")
    parser.add_argument("--mat", type=Path, required=True, help="Path to .mat file")
    parser.add_argument("--dataset", type=str, default="", help="Dataset name (e.g. B0005)")
    parser.add_argument("--vehicle_id", type=int, default=1)
    parser.add_argument("--cells", type=int, default=1, help="Number of cells (currently 1 cell per file)")
    parser.add_argument("--batch", type=int, default=5000)
    args = parser.parse_args()
    source = args.dataset or args.mat.stem
    n = ingest_mat_to_db(args.mat, vehicle_id=args.vehicle_id, cell_id=1, source_tag=f"nasa_{source}", batch_size=args.batch)
    print(f"Inserted {n} rows from {args.mat}")


if __name__ == "__main__":
    main()
