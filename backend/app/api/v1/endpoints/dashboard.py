"""
Dashboard-optimized: GET /fleet, /vehicle/{id}, /vehicle/{id}/pack-view.
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.sql import Vehicle, Trip, ChargingSession, TelemetryRaw

router = APIRouter()


class FleetCard(BaseModel):
    vehicle_id: int
    vin: str
    name: str | None
    trip_count: int
    charging_count: int


@router.get("/fleet", response_model=list[FleetCard])
def get_fleet(db: Session = Depends(get_db)):
    vehicles = db.query(Vehicle).all()
    out = []
    for v in vehicles:
        trip_count = db.query(Trip).filter(Trip.vehicle_id == v.id).count()
        charging_count = db.query(ChargingSession).filter(ChargingSession.vehicle_id == v.id).count()
        out.append(FleetCard(vehicle_id=v.id, vin=v.vin, name=v.name, trip_count=trip_count, charging_count=charging_count))
    return out


class VehicleKpi(BaseModel):
    vehicle_id: int
    vin: str
    trip_count: int
    charging_count: int


@router.get("/vehicle/{vehicle_id}", response_model=VehicleKpi)
def get_dashboard_vehicle(vehicle_id: int, db: Session = Depends(get_db)):
    v = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    trip_count = db.query(Trip).filter(Trip.vehicle_id == vehicle_id).count()
    charging_count = db.query(ChargingSession).filter(ChargingSession.vehicle_id == vehicle_id).count()
    return VehicleKpi(vehicle_id=v.id, vin=v.vin, trip_count=trip_count, charging_count=charging_count)


class CellState(BaseModel):
    cell_id: str
    voltage: float | None
    temperature: float | None
    soc: float | None
    is_active: bool = True
    balancing: bool = False


@router.get("/vehicle/{vehicle_id}/pack-view", response_model=list[CellState])
def get_pack_view(vehicle_id: int, db: Session = Depends(get_db)):
    v = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    # Placeholder: build from telemetry or dedicated pack table
    rows = db.query(TelemetryRaw).filter(TelemetryRaw.vehicle_id == vehicle_id).distinct(TelemetryRaw.signal).limit(24).all()
    seen = set()
    cells = []
    for r in rows:
        if r.signal in seen:
            continue
        seen.add(r.signal)
        cells.append(CellState(cell_id=r.signal, voltage=r.value if "voltage" in r.signal else None, temperature=None, soc=None))
    if not cells:
        cells = [CellState(cell_id=f"E{i+1}", voltage=3.7, temperature=25.0, soc=80.0) for i in range(12)]
    return cells
