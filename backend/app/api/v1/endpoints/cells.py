"""
Cells API: latest snapshot and timeseries from DB.
GET /api/v1/cells/latest?vehicle_id=1
GET /api/v1/cells/timeseries?cell_id=1&signal=voltage&start=...&end=...
"""

from datetime import datetime
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services.telemetry_service import get_cells_latest, get_cell_timeseries

router = APIRouter()


@router.get("/latest")
def get_latest(
    vehicle_id: int = Query(1, ge=1),
    db: Session = Depends(get_db),
):
    """Latest telemetry row per cell for vehicle_id."""
    rows = get_cells_latest(db, vehicle_id=vehicle_id)
    return {"vehicle_id": vehicle_id, "cells": rows}


@router.get("/timeseries")
def get_timeseries(
    cell_id: int = Query(..., ge=1),
  vehicle_id: int = Query(1, ge=1),
  signal: str = Query("voltage", description="voltage | current | temperature | soc"),
  start: str | None = Query(None, description="ISO datetime"),
  end: str | None = Query(None, description="ISO datetime"),
  agg_sec: int | None = Query(None, ge=1, le=3600),
  limit: int = Query(5000, ge=1, le=50000),
  db: Session = Depends(get_db),
):
    """Time-series for one cell. Optional downsampling agg_sec."""
    start_dt = None
    end_dt = None
    if start:
        try:
            start_dt = datetime.fromisoformat(start.replace("Z", "+00:00"))
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid start datetime")
    if end:
        try:
            end_dt = datetime.fromisoformat(end.replace("Z", "+00:00"))
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid end datetime")
    if signal not in ("voltage", "current", "temperature", "soc"):
        raise HTTPException(status_code=400, detail="signal must be voltage|current|temperature|soc")
    points = get_cell_timeseries(
        db,
        cell_id=cell_id,
        vehicle_id=vehicle_id,
        signal=signal,
        start=start_dt,
        end=end_dt,
        agg_sec=agg_sec,
        limit=limit,
    )
    return {"vehicle_id": vehicle_id, "cell_id": cell_id, "signal": signal, "points": points}
