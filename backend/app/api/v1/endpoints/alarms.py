"""
Alarms API v1: list, detail (with evidence), ack.
"""

from fastapi import APIRouter, Depends, HTTPException, Query

from app.db.session import get_db
from app.services.alarm_service import (
    get_alarm_by_id,
    get_evidence_for_alarm,
    ack_alarm,
    list_alarms,
)
from app.schemas.v1_dashboard import AlarmDetail, AlarmEvidenceItem, AlarmAckBody
from sqlalchemy.orm import Session

router = APIRouter()


@router.get("", response_model=dict)
def get_alarms_list(
    vehicle_id: int = Query(1, ge=1),
    hours: int = Query(168, ge=1, le=720),
    limit: int = Query(200, ge=1, le=500),
    db: Session = Depends(get_db),
):
    """List alarms (last N hours)."""
    alarms = list_alarms(db, vehicle_id=vehicle_id, hours=hours, limit=limit)
    return {"alarms": alarms, "count": len(alarms)}


@router.get("/{alarm_id}", response_model=AlarmDetail)
def get_alarm_detail(
    alarm_id: int,
    db: Session = Depends(get_db),
):
    """Alarm detail with evidence and recommended_action."""
    alarm = get_alarm_by_id(db, alarm_id)
    if not alarm:
        raise HTTPException(status_code=404, detail="Alarm not found")
    evidence_rows = get_evidence_for_alarm(db, alarm_id)
    evidence = [
        AlarmEvidenceItem(
            id=e["id"],
            alarm_id=e["alarm_id"],
            reason_type=e["reason_type"],
            description=e.get("description"),
            rule_id=e.get("rule_id"),
            rule_json=e.get("rule_json"),
            model_run_id=e.get("model_run_id"),
            model_name=e.get("model_name"),
            anomaly_score=e.get("anomaly_score"),
            anomaly_threshold=e.get("anomaly_threshold"),
            top_features=e.get("top_features"),
            created_at=e.get("created_at"),
        )
        for e in evidence_rows
    ]
    return AlarmDetail(
        **alarm,
        evidence=evidence,
        recommended_action="Review cell and pack telemetry; acknowledge when resolved.",
    )


@router.post("/{alarm_id}/ack", response_model=dict)
def post_alarm_ack(
  alarm_id: int,
  body: AlarmAckBody | None = None,
  db: Session = Depends(get_db),
):
    """Acknowledge an alarm. Requires alarm_event.acknowledged_at column (see DB_SCHEMA_MYSQL_EXTENDED)."""
    alarm = get_alarm_by_id(db, alarm_id)
    if not alarm:
        raise HTTPException(status_code=404, detail="Alarm not found")
    by = (body.acknowledged_by if body else None) or "operator"
    ok = ack_alarm(db, alarm_id, acknowledged_by=by)
    if not ok:
        raise HTTPException(
            status_code=501,
            detail="Ack not supported: add acknowledged_at, acknowledged_by to alarm_event (see extended schema).",
        )
    return {"ok": True, "alarm_id": alarm_id, "acknowledged_by": by}
