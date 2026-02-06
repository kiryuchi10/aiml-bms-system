"""
Dashboard-optimized service using DB: pack-summary, worst-cell, active-alarms.
Uses telemetry_cell, telemetry_pack, alarm_event. Append-only; no mock.
"""

from __future__ import annotations

from datetime import datetime, timezone, timedelta
from typing import Any, Optional

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.telemetry_bms import TelemetryCell, TelemetryPack
from app.models.alarm_event import AlarmEvent


def get_pack_summary(db: Session, vehicle_id: int = 1) -> Optional[dict[str, Any]]:
    """
    Pack summary for dashboard: from latest telemetry_pack or derived from latest cells.
    Returns: ts, pack_voltage, pack_current, pack_temp, soc, soh, min_cell_v, max_cell_v, cell_count.
    """
    # Try telemetry_pack first
    pack = (
        db.query(TelemetryPack)
        .filter(TelemetryPack.vehicle_id == vehicle_id)
        .order_by(TelemetryPack.ts.desc())
        .first()
    )
    if pack:
        return {
            "ts": pack.ts.isoformat() if pack.ts else None,
            "pack_voltage": pack.pack_voltage,
            "pack_current": pack.pack_current,
            "pack_temp": pack.pack_temp,
            "soc": pack.soc,
            "soh": pack.soh,
            "min_cell_v": None,
            "max_cell_v": None,
            "cell_count": None,
        }
    # Derive from latest cells
    cells = (
        db.query(TelemetryCell)
        .filter(TelemetryCell.vehicle_id == vehicle_id)
        .order_by(TelemetryCell.ts.desc())
        .limit(256)
        .all()
    )
    if not cells:
        return None
    # Latest ts
    latest_ts = cells[0].ts
    # Same-ts rows (or take latest per cell and aggregate)
    same_ts = [c for c in cells if c.ts == latest_ts]
    voltages = [c.voltage for c in same_ts if c.voltage is not None]
    temps = [c.temperature for c in same_ts if c.temperature is not None]
    currents = [c.current for c in same_ts if c.current is not None]
    socs = [c.soc for c in same_ts if c.soc is not None]
    pack_v = sum(voltages) if voltages else None
    pack_i = sum(currents) if currents else None
    pack_t = sum(temps) / len(temps) if temps else None
    soc = sum(socs) / len(socs) if socs else None
    return {
        "ts": latest_ts.isoformat() if latest_ts else None,
        "pack_voltage": pack_v,
        "pack_current": pack_i,
        "pack_temp": pack_t,
        "soc": soc,
        "soh": 1.0,
        "min_cell_v": min(voltages) if voltages else None,
        "max_cell_v": max(voltages) if voltages else None,
        "cell_count": len(same_ts),
    }


def get_worst_cell(db: Session, vehicle_id: int = 1) -> Optional[dict[str, Any]]:
    """
    Worst cell: by lowest voltage or highest temperature in latest snapshot.
    Returns: cell_id, ts, voltage, temperature, current, soc, reason (e.g. "lowest_voltage").
    """
    cells = (
        db.query(TelemetryCell)
        .filter(TelemetryCell.vehicle_id == vehicle_id)
        .order_by(TelemetryCell.ts.desc())
        .limit(256)
        .all()
    )
    if not cells:
        return None
    latest_ts = cells[0].ts
    same_ts = [c for c in cells if c.ts == latest_ts]
    if not same_ts:
        return None
    # Worst by voltage (min) or temp (max)
    by_v = [c for c in same_ts if c.voltage is not None]
    by_t = [c for c in same_ts if c.temperature is not None]
    worst = same_ts[0]
    reason = "latest"
    if by_v:
        min_c = min(by_v, key=lambda c: c.voltage or 999)
        worst = min_c
        reason = "lowest_voltage"
    if by_t:
        max_c = max(by_t, key=lambda c: c.temperature or -999)
        if reason == "latest" or (max_c.temperature or 0) > 45:
            worst = max_c
            reason = "highest_temperature"
    return {
        "cell_id": worst.cell_id,
        "ts": worst.ts.isoformat() if worst.ts else None,
        "voltage": worst.voltage,
        "temperature": worst.temperature,
        "current": worst.current,
        "soc": worst.soc,
        "reason": reason,
    }


def get_active_alarms(
    db: Session,
    vehicle_id: int = 1,
    since_ts: Optional[datetime] = None,
    limit: int = 100,
) -> list[dict[str, Any]]:
    """
    Active alarm_event rows (e.g. last 24h or since_ts). Returns list of alarm dicts.
    """
    q = (
        db.query(AlarmEvent)
        .filter(AlarmEvent.vehicle_id == vehicle_id)
        .order_by(AlarmEvent.ts.desc())
        .limit(limit)
    )
    if since_ts is not None:
        q = q.filter(AlarmEvent.ts >= since_ts)
    rows = q.all()
    return [
        {
            "id": r.id,
            "vehicle_id": r.vehicle_id,
            "cell_id": r.cell_id,
            "ts": r.ts.isoformat() if r.ts else None,
            "severity": r.severity,
            "alarm_type": r.alarm_type,
            "value": r.value,
            "threshold": r.threshold,
            "rationale": r.rationale,
            "source": r.source,
        }
        for r in rows
    ]
