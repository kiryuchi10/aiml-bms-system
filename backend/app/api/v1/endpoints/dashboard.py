"""
Dashboard-optimized API: overview, cell-grid, balancing-status, alarms;
pack-summary, worst-cell, active-alarms (from DB).
"""

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services.dashboard_service import (
    get_dashboard_overview,
    get_dashboard_cell_grid,
    get_dashboard_balancing_status,
    get_dashboard_alarms,
    set_cell_balancing,
)
from app.services.dashboard_db_service import get_pack_summary as get_pack_summary_db
from app.services.dashboard_db_service import get_worst_cell as get_worst_cell_db
from app.services.dashboard_db_service import get_active_alarms as get_active_alarms_db
from pydantic import BaseModel
from datetime import datetime, timezone, timedelta

router = APIRouter()


# ---------- DB-backed dashboard (vehicle_id) ----------

@router.get("/pack-summary")
def get_pack_summary(
    vehicle_id: int = Query(1, ge=1),
    db: Session = Depends(get_db),
):
    """Pack summary from DB (latest pack or derived from cells)."""
    out = get_pack_summary_db(db, vehicle_id=vehicle_id)
    if not out:
        raise HTTPException(status_code=404, detail="No telemetry for vehicle")
    return out


@router.get("/worst-cell")
def get_worst_cell(
    vehicle_id: int = Query(1, ge=1),
    db: Session = Depends(get_db),
):
    """Worst cell (lowest voltage or highest temp) from latest snapshot."""
    out = get_worst_cell_db(db, vehicle_id=vehicle_id)
    if not out:
        raise HTTPException(status_code=404, detail="No telemetry for vehicle")
    return out


@router.get("/active-alarms")
def get_active_alarms(
    vehicle_id: int = Query(1, ge=1),
    hours: int = Query(24, ge=1, le=168),
    db: Session = Depends(get_db),
):
    """Active alarms from alarm_event (last N hours)."""
    since = datetime.now(timezone.utc) - timedelta(hours=hours)
    alarms = get_active_alarms_db(db, vehicle_id=vehicle_id, since_ts=since)
    return {"alarms": alarms, "count": len(alarms)}


# ---------- Parquet-backed (existing) ----------


@router.get("/overview")
def get_overview(
    dataset_key: str | None = Query(None),
    row_index: int = Query(0, ge=0),
):
    """Single call for header/summary: pack, alarm count, balancing count."""
    overview = get_dashboard_overview(dataset_key=dataset_key, row_index=row_index)
    if not overview:
        raise HTTPException(status_code=404, detail="No parquet data or dataset not found")
    return overview.model_dump()


@router.get("/cell-grid")
def get_cell_grid(
    dataset_key: str | None = Query(None),
    row_index: int = Query(0, ge=0),
):
    """Cell grid with backend-computed min/max and status."""
    grid = get_dashboard_cell_grid(dataset_key=dataset_key, row_index=row_index)
    if not grid:
        raise HTTPException(status_code=404, detail="No parquet data or dataset not found")
    return grid.model_dump()


@router.get("/balancing-status")
def get_balancing_status(dataset_key: str | None = Query(None)):
    """Current balancing status: active cell ids, max_active, detail."""
    status = get_dashboard_balancing_status(dataset_key=dataset_key)
    return status.model_dump()


class BalanceSetBody(BaseModel):
    dataset_key: str
    cell_id: int
    enabled: bool


@router.post("/balancing/set")
def post_balancing_set(body: BalanceSetBody):
    """Set balancing on/off for a cell (control)."""
    set_cell_balancing(body.dataset_key, body.cell_id, body.enabled)
    return {"ok": True, "cell_id": body.cell_id, "enabled": body.enabled}


@router.get("/alarms")
def get_alarms(
    dataset_key: str | None = Query(None),
    row_index: int = Query(0, ge=0),
):
    """Active alarms with severity (backend-derived from thresholds)."""
    alarms = get_dashboard_alarms(dataset_key=dataset_key, row_index=row_index)
    if not alarms:
        return {"alarms": [], "count": 0}
    return alarms.model_dump()
