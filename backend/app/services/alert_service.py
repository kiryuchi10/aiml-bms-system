"""
Alert service: rule engine to generate alarm_event rows from telemetry.
Thresholds: over_voltage, under_voltage, over_temp, under_temp, etc.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Optional

from sqlalchemy.orm import Session

from app.models.telemetry_bms import TelemetryCell
from app.models.alarm_event import AlarmEvent

# Default thresholds (configurable via config later)
OVER_VOLTAGE = 4.25
UNDER_VOLTAGE = 2.50
OVER_TEMP = 55.0
UNDER_TEMP = -10.0


def evaluate_cell_alarms(
    vehicle_id: int,
    cell_id: int,
  module_id: Optional[int],
    ts: datetime,
    voltage: Optional[float],
    temperature: Optional[float],
    current: Optional[float],
) -> list[dict[str, Any]]:
    """
    Evaluate threshold rules for one cell row. Returns list of alarm dicts
    (vehicle_id, module_id, cell_id, ts, severity, alarm_type, value, threshold, rationale, source).
    """
    alarms: list[dict[str, Any]] = []
    if voltage is not None:
        if voltage >= OVER_VOLTAGE:
            alarms.append({
                "vehicle_id": vehicle_id,
                "module_id": module_id,
                "cell_id": cell_id,
                "ts": ts,
                "severity": "red",
                "alarm_type": "over_voltage",
                "value": voltage,
                "threshold": OVER_VOLTAGE,
                "rationale": f"Cell {cell_id} voltage {voltage:.3f}V >= {OVER_VOLTAGE}V",
                "source": "rule_engine",
            })
        elif voltage <= UNDER_VOLTAGE:
            alarms.append({
                "vehicle_id": vehicle_id,
                "module_id": module_id,
                "cell_id": cell_id,
                "ts": ts,
                "severity": "red",
                "alarm_type": "under_voltage",
                "value": voltage,
                "threshold": UNDER_VOLTAGE,
                "rationale": f"Cell {cell_id} voltage {voltage:.3f}V <= {UNDER_VOLTAGE}V",
                "source": "rule_engine",
            })
    if temperature is not None:
        if temperature >= OVER_TEMP:
            alarms.append({
                "vehicle_id": vehicle_id,
                "module_id": module_id,
                "cell_id": cell_id,
                "ts": ts,
                "severity": "red",
                "alarm_type": "over_temp",
                "value": temperature,
                "threshold": OVER_TEMP,
                "rationale": f"Cell {cell_id} temp {temperature:.1f}°C >= {OVER_TEMP}°C",
                "source": "rule_engine",
            })
        elif temperature <= UNDER_TEMP:
            alarms.append({
                "vehicle_id": vehicle_id,
                "module_id": module_id,
                "cell_id": cell_id,
                "ts": ts,
                "severity": "yellow",
                "alarm_type": "under_temp",
                "value": temperature,
                "threshold": UNDER_TEMP,
                "rationale": f"Cell {cell_id} temp {temperature:.1f}°C <= {UNDER_TEMP}°C",
                "source": "rule_engine",
            })
    return alarms


def process_telemetry_and_emit_alarms(
    db: Session,
    vehicle_id: int = 1,
    since_ts: Optional[datetime] = None,
  limit: int = 10000,
) -> int:
    """
    Query recent telemetry_cell rows (since since_ts), evaluate rules, insert alarm_event rows.
    Returns count of new alarms inserted. Idempotent: only inserts if no matching alarm_event exists (e.g. same ts+cell_id+alarm_type).
    """
    q = (
        db.query(TelemetryCell)
        .filter(TelemetryCell.vehicle_id == vehicle_id)
        .order_by(TelemetryCell.ts.asc())
        .limit(limit)
    )
    if since_ts is not None:
        q = q.filter(TelemetryCell.ts >= since_ts)
    rows = q.all()
    inserted = 0
    for r in rows:
        alarms = evaluate_cell_alarms(
            vehicle_id=r.vehicle_id or vehicle_id,
            cell_id=r.cell_id,
            module_id=r.module_id,
            ts=r.ts,
            voltage=r.voltage,
            temperature=r.temperature,
            current=r.current,
        )
        for a in alarms:
            # Avoid duplicate: check if we already have this alarm for this ts/cell/type
            existing = (
                db.query(AlarmEvent)
                .filter(
                    AlarmEvent.vehicle_id == a["vehicle_id"],
                    AlarmEvent.cell_id == a["cell_id"],
                    AlarmEvent.ts == a["ts"],
                    AlarmEvent.alarm_type == a["alarm_type"],
                )
                .first()
            )
            if not existing:
                db.add(AlarmEvent(
                    vehicle_id=a["vehicle_id"],
                    module_id=a["module_id"],
                    cell_id=a["cell_id"],
                    ts=a["ts"],
                    severity=a["severity"],
                    alarm_type=a["alarm_type"],
                    value=a["value"],
                    threshold=a["threshold"],
                    rationale=a["rationale"],
                    source=a["source"],
                ))
                inserted += 1
    if inserted:
        db.commit()
    return inserted
