"""
Telemetry service: query telemetry_cell with downsampling (start, end, agg).
Append-only; no updates. Used by dashboard and cells/timeseries endpoints.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Optional

from sqlalchemy import func, and_
from sqlalchemy.orm import Session

from app.models.telemetry_bms import TelemetryCell, TelemetryPack


def get_cells_latest(
    db: Session,
    vehicle_id: int = 1,
    limit_per_cell: int = 1,
) -> list[dict[str, Any]]:
    """
    Latest telemetry row per cell_id for vehicle_id.
    Returns list of { cell_id, ts, voltage, current, temperature, soc, balancing }.
    """
    # Subquery: max(ts) per cell_id
    subq = (
        db.query(TelemetryCell.cell_id, func.max(TelemetryCell.ts).label("max_ts"))
        .filter(TelemetryCell.vehicle_id == vehicle_id)
        .group_by(TelemetryCell.cell_id)
        .subquery()
    )
    q = (
        db.query(TelemetryCell)
        .join(subq, and_(
            TelemetryCell.cell_id == subq.c.cell_id,
            TelemetryCell.ts == subq.c.max_ts,
        ))
        .filter(TelemetryCell.vehicle_id == vehicle_id)
        .limit(256)
    )
    rows = q.all()
    return [
        {
            "cell_id": r.cell_id,
            "ts": r.ts.isoformat() if r.ts else None,
            "voltage": r.voltage,
            "current": r.current,
            "temperature": r.temperature,
            "soc": r.soc,
            "balancing": r.balancing,
        }
        for r in rows
    ]


def get_cell_timeseries(
    db: Session,
    cell_id: int,
    vehicle_id: int = 1,
    signal: str = "voltage",
    start: Optional[datetime] = None,
    end: Optional[datetime] = None,
    agg_sec: Optional[int] = None,
    limit: int = 5000,
) -> list[dict[str, Any]]:
    """
    Time-series for one cell. signal in (voltage, current, temperature, soc).
    If agg_sec set, downsample by averaging over agg_sec windows.
    """
    col = getattr(TelemetryCell, signal, None)
    if col is None:
        col = TelemetryCell.voltage
    q = (
        db.query(TelemetryCell.ts, col)
        .filter(
            TelemetryCell.vehicle_id == vehicle_id,
            TelemetryCell.cell_id == cell_id,
        )
    )
    if start is not None:
        q = q.filter(TelemetryCell.ts >= start)
    if end is not None:
        q = q.filter(TelemetryCell.ts <= end)
    q = q.order_by(TelemetryCell.ts).limit(limit)
    rows = q.all()
    if not agg_sec or agg_sec <= 0:
        return [{"ts": r[0].isoformat() if r[0] else None, "value": r[1]} for r in rows]
    # Simple downsampling: group by floor(ts / agg_sec), take mean
    from collections import defaultdict
    buckets: dict[int, list[float]] = defaultdict(list)
    for r in rows:
        t, v = r[0], r[1]
        if t is None or v is None:
            continue
        bucket = int(t.timestamp()) // agg_sec
        buckets[bucket].append(v)
    out = []
    for bucket in sorted(buckets.keys()):
        vals = buckets[bucket]
        ts_utc = datetime.fromtimestamp(bucket * agg_sec, tz=timezone.utc)
        out.append({"ts": ts_utc.isoformat(), "value": sum(vals) / len(vals)})
    return out


def get_latest_pack(
    db: Session,
    vehicle_id: int = 1,
) -> Optional[dict[str, Any]]:
    """Latest telemetry_pack row for vehicle."""
    r = (
        db.query(TelemetryPack)
        .filter(TelemetryPack.vehicle_id == vehicle_id)
        .order_by(TelemetryPack.ts.desc())
        .first()
    )
    if not r:
        return None
    return {
        "ts": r.ts.isoformat() if r.ts else None,
        "pack_voltage": r.pack_voltage,
        "pack_current": r.pack_current,
        "pack_power": r.pack_power,
        "soc": r.soc,
        "soh": r.soh,
        "pack_temp": r.pack_temp,
        "source": r.source,
    }


def get_replay_cursor(
    db: Session,
    vehicle_id: int = 1,
    order_ts_asc: bool = True,
    limit: int = 1,
) -> list[TelemetryCell]:
    """
    Fetch a batch of telemetry_cell rows for WS replay (by ts order).
    """
    q = (
        db.query(TelemetryCell)
        .filter(TelemetryCell.vehicle_id == vehicle_id)
        .order_by(TelemetryCell.ts.asc() if order_ts_asc else TelemetryCell.ts.desc())
        .limit(limit)
    )
    return list(q.all())
