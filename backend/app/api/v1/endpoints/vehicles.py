"""
Vehicles: GET /vehicles, /vehicles/{id}, /vehicles/{id}/summary, /vehicles/{id}/trips, /vehicles/{id}/charging-sessions.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.sql import Vehicle, Trip, ChargingSession

router = APIRouter()


class VehicleMeta(BaseModel):
    vin: str
    name: str | None
    meta: dict


class VehicleSummary(BaseModel):
    vehicle_id: int
    vin: str
    trip_count: int
    charging_count: int


class TripMeta(BaseModel):
    id: int
    start_ts: str
    end_ts: str
    distance_km: float | None


class ChargingMeta(BaseModel):
    id: int
    start_ts: str
    end_ts: str
    start_soc: float | None
    end_soc: float | None


@router.get("", response_model=list[VehicleMeta])
def list_vehicles(db: Session = Depends(get_db)):
    rows = db.query(Vehicle).all()
    return [VehicleMeta(vin=v.vin, name=v.name, meta=v.meta or {}) for v in rows]


@router.get("/{vehicle_id}", response_model=VehicleMeta)
def get_vehicle(vehicle_id: int, db: Session = Depends(get_db)):
    v = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return VehicleMeta(vin=v.vin, name=v.name, meta=v.meta or {})


@router.get("/{vehicle_id}/summary", response_model=VehicleSummary)
def get_vehicle_summary(vehicle_id: int, db: Session = Depends(get_db)):
    v = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    trip_count = db.query(Trip).filter(Trip.vehicle_id == vehicle_id).count()
    charging_count = db.query(ChargingSession).filter(ChargingSession.vehicle_id == vehicle_id).count()
    return VehicleSummary(vehicle_id=v.id, vin=v.vin, trip_count=trip_count, charging_count=charging_count)


@router.get("/{vehicle_id}/trips", response_model=list[TripMeta])
def list_trips(vehicle_id: int, limit: int = Query(50, le=500), db: Session = Depends(get_db)):
    rows = db.query(Trip).filter(Trip.vehicle_id == vehicle_id).order_by(Trip.start_ts.desc()).limit(limit).all()
    return [TripMeta(id=r.id, start_ts=r.start_ts.isoformat(), end_ts=r.end_ts.isoformat(), distance_km=r.distance_km) for r in rows]


@router.get("/{vehicle_id}/charging-sessions", response_model=list[ChargingMeta])
def list_charging_sessions(vehicle_id: int, limit: int = Query(50, le=500), db: Session = Depends(get_db)):
    rows = db.query(ChargingSession).filter(ChargingSession.vehicle_id == vehicle_id).order_by(ChargingSession.start_ts.desc()).limit(limit).all()
    return [ChargingMeta(id=r.id, start_ts=r.start_ts.isoformat(), end_ts=r.end_ts.isoformat(), start_soc=r.start_soc, end_soc=r.end_soc) for r in rows]
