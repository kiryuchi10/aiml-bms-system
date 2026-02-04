from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.sql import ChargingSession

router = APIRouter()


class ChargingMeta(BaseModel):
    id: int
    vehicle_id: int
    start_ts: str
    end_ts: str
    start_soc: float | None
    end_soc: float | None


@router.get("/{session_id}/detail", response_model=ChargingMeta)
def get_charging_detail(session_id: int, db: Session = Depends(get_db)):
    r = db.query(ChargingSession).filter(ChargingSession.id == session_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Charging session not found")
    return ChargingMeta(id=r.id, vehicle_id=r.vehicle_id, start_ts=r.start_ts.isoformat(), end_ts=r.end_ts.isoformat(), start_soc=r.start_soc, end_soc=r.end_soc)
