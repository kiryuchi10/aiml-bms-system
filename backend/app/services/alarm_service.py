"""
Alarm service: get alarm by id, list, evidence, ack.
Uses alarm_event and alarm_evidence (raw SQL for evidence).
"""

from __future__ import annotations

from datetime import datetime, timezone, timedelta
from typing import Any, Optional

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.services.dashboard_db_service import get_active_alarms


def get_alarm_by_id(db: Session, alarm_id: int) -> Optional[dict[str, Any]]:
    """Get a single alarm_event by id."""
    from app.models.alarm_event import AlarmEvent

    row = db.query(AlarmEvent).filter(AlarmEvent.id == alarm_id).first()
    if not row:
        return None
    out = {
        "id": row.id,
        "vehicle_id": row.vehicle_id,
        "module_id": row.module_id,
        "cell_id": row.cell_id,
        "ts": row.ts.isoformat() if row.ts else None,
        "severity": row.severity,
        "alarm_type": row.alarm_type,
        "value": row.value,
        "threshold": row.threshold,
        "rationale": row.rationale,
        "source": row.source,
    }
    if hasattr(row, "acknowledged_at") and row.acknowledged_at:
        out["acknowledged_at"] = row.acknowledged_at.isoformat()
    if hasattr(row, "acknowledged_by") and row.acknowledged_by:
        out["acknowledged_by"] = row.acknowledged_by
    return out


def get_evidence_for_alarm(db: Session, alarm_id: int) -> list[dict[str, Any]]:
    """Get alarm_evidence rows (raw SQL)."""
    try:
        r = db.execute(
            text(
                "SELECT id, alarm_id, reason_type, description, rule_id, rule_json, "
                "model_run_id, model_name, anomaly_score, anomaly_threshold, top_features, created_at "
                "FROM alarm_evidence WHERE alarm_id = :aid ORDER BY id"
            ),
            {"aid": alarm_id},
        )
        rows = r.fetchall()
    except Exception:
        return []
    return [
        {
            "id": row[0],
            "alarm_id": row[1],
            "reason_type": row[2],
            "description": row[3],
            "rule_id": row[4],
            "rule_json": row[5],
            "model_run_id": row[6],
            "model_name": row[7],
            "anomaly_score": row[8],
            "anomaly_threshold": row[9],
            "top_features": row[10],
            "created_at": row[11].isoformat() if row[11] else None,
        }
        for row in rows
    ]


def ack_alarm(db: Session, alarm_id: int, acknowledged_by: Optional[str] = None) -> bool:
    """Set acknowledged_at (raw SQL)."""
    try:
        db.execute(
            text(
                "UPDATE alarm_event SET acknowledged_at = CURRENT_TIMESTAMP(3), acknowledged_by = :by WHERE id = :id"
            ),
            {"id": alarm_id, "by": acknowledged_by or "operator"},
        )
        db.commit()
        return True
    except Exception:
        db.rollback()
        return False


def list_alarms(db: Session, vehicle_id: int = 1, hours: int = 168, limit: int = 200) -> list[dict[str, Any]]:
    """List alarms."""
    since = datetime.now(timezone.utc) - timedelta(hours=hours)
    return get_active_alarms(db, vehicle_id=vehicle_id, since_ts=since, limit=limit)
