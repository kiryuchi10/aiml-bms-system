from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.sql import Trip, Vehicle

router = APIRouter()


class TripMeta(BaseModel):
    id: int
    vehicle_id: int
    start_ts: str
    end_ts: str
    distance_km: float | None


@router.get("/{trip_id}/detail", response_model=TripMeta)
def get_trip_detail(trip_id: int, db: Session = Depends(get_db)):
    r = db.query(Trip).filter(Trip.id == trip_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Trip not found")
    return TripMeta(id=r.id, vehicle_id=r.vehicle_id, start_ts=r.start_ts.isoformat(), end_ts=r.end_ts.isoformat(), distance_km=r.distance_km)
