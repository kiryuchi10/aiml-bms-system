"""
Telemetry: GET /{vehicle_id}/signals, /{vehicle_id}/timeseries?signal=...&t0=...&t1=...&ds=1s
"""
from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.sql import TelemetryRaw

router = APIRouter()


class SignalMeta(BaseModel):
    signal: str


@router.get("/{vehicle_id}/signals", response_model=list[SignalMeta])
def list_signals(vehicle_id: int, db: Session = Depends(get_db)):
    rows = db.query(TelemetryRaw.signal).filter(TelemetryRaw.vehicle_id == vehicle_id).distinct().all()
    return [SignalMeta(signal=r[0]) for r in rows]


class TimeseriesPoint(BaseModel):
    ts: str
    value: float


@router.get("/{vehicle_id}/timeseries", response_model=list[TimeseriesPoint])
def get_timeseries(
    vehicle_id: int,
    signal: str = Query(...),
    t0: str | None = Query(None),
    t1: str | None = Query(None),
    ds: str | None = Query(None, description="Downsample e.g. 1s"),
    db: Session = Depends(get_db),
):
    q = db.query(TelemetryRaw).filter(TelemetryRaw.vehicle_id == vehicle_id, TelemetryRaw.signal == signal)
    if t0:
        q = q.filter(TelemetryRaw.ts >= t0)
    if t1:
        q = q.filter(TelemetryRaw.ts <= t1)
    q = q.order_by(TelemetryRaw.ts)
    rows = q.limit(5000).all()
    return [TimeseriesPoint(ts=r.ts.isoformat(), value=r.value) for r in rows]
