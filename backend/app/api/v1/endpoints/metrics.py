from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.sql import MetricAging, Vehicle

router = APIRouter()


class AgingPoint(BaseModel):
    metric: str
    value: float
    ts: str


@router.get("/{vehicle_id}/aging", response_model=list[AgingPoint])
def get_aging(vehicle_id: int, db: Session = Depends(get_db)):
    v = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    rows = db.query(MetricAging).filter(MetricAging.vehicle_id == vehicle_id).order_by(MetricAging.ts.desc()).limit(500).all()
    return [AgingPoint(metric=r.metric, value=r.value, ts=r.ts.isoformat()) for r in rows]
