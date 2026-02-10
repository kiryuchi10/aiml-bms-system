"""
Dashboard-optimized API: overview, cell-grid, balancing-status, alarms;
pack-summary, worst-cell, active-alarms (from DB).
When no dataset_key is provided, overview/cell-grid/alarms fall back to DB (vehicle_id).
"""

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone, timedelta

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
from app.services.telemetry_service import get_cells_latest
from app.schemas.v1_dashboard import (
    PackTelemetry,
    CellTelemetry,
    DashboardOverview,
    DashboardCellGrid,
    DashboardAlarms,
)
from pydantic import BaseModel

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


def _overview_from_db(db: Session, vehicle_id: int) -> dict:
    """Build DashboardOverview shape from DB (pack, worst-cell, active alarms). Returns default when no data."""
    pack_dict = get_pack_summary_db(db, vehicle_id=vehicle_id)
    since = datetime.now(timezone.utc) - timedelta(hours=168)
    alarms = get_active_alarms_db(db, vehicle_id=vehicle_id, since_ts=since, limit=500)
    cells = get_cells_latest(db, vehicle_id=vehicle_id)
    balancing_count = sum(1 for c in cells if c.get("balancing"))
    if not pack_dict:
        pack = PackTelemetry(
            voltage=0.0, current=0.0, temp=0.0, soc=0.0, soh=1.0,
            min_cell_v=0.0, max_cell_v=0.0, status="unknown",
        )
        return DashboardOverview(
            timestamp=datetime.now(timezone.utc).isoformat(),
            dataset_key=None,
            row_index=None,
            pack=pack,
            alarm_count=len(alarms),
            balancing_active_count=balancing_count,
        ).model_dump()
    pack = PackTelemetry(
        voltage=float(pack_dict.get("pack_voltage") or 0),
        current=float(pack_dict.get("pack_current") or 0),
        temp=float(pack_dict.get("pack_temp") or 0),
        soc=float(pack_dict.get("soc") or 0),
        soh=float(pack_dict.get("soh") or 1.0),
        min_cell_v=float(pack_dict.get("min_cell_v") or 0),
        max_cell_v=float(pack_dict.get("max_cell_v") or 0),
        status="unknown",
    )
    return DashboardOverview(
        timestamp=pack_dict.get("ts") or datetime.now(timezone.utc).isoformat(),
        dataset_key=None,
        row_index=None,
        pack=pack,
        alarm_count=len(alarms),
        balancing_active_count=balancing_count,
    ).model_dump()


@router.get("/overview")
def get_overview(
    dataset_key: str | None = Query(None),
    row_index: int = Query(0, ge=0),
    vehicle_id: int = Query(1, ge=1),
    db: Session = Depends(get_db),
):
    """Single call for header/summary: pack, alarm count, balancing. Uses DB when no dataset_key."""
    if dataset_key:
        overview = get_dashboard_overview(dataset_key=dataset_key, row_index=row_index)
        if not overview:
            raise HTTPException(status_code=404, detail="No parquet data or dataset not found")
        return overview.model_dump()
    return _overview_from_db(db, vehicle_id=vehicle_id)


def _cell_grid_from_db(db: Session, vehicle_id: int) -> dict:
    """Build DashboardCellGrid from get_cells_latest. Returns empty grid when no data."""
    rows = get_cells_latest(db, vehicle_id=vehicle_id)
    if not rows:
        return DashboardCellGrid(
            timestamp=datetime.now(timezone.utc).isoformat(),
            cells=[],
            pack_mean_v=0.0,
            pack_min_v=0.0,
            pack_max_v=0.0,
        ).model_dump()
    vs = [float(c.get("voltage") or 0) for c in rows]
    pack_min_v = min(vs) if vs else 0.0
    pack_max_v = max(vs) if vs else 0.0
    pack_mean_v = (sum(vs) / len(vs)) if vs else 0.0
    cells = []
    for c in rows:
        v = float(c.get("voltage") or 0)
        t = float(c.get("temperature") or 0)
        soc = float(c.get("soc") or 0)
        if 0 < soc <= 1:
            pass
        else:
            soc = soc / 100.0 if soc > 1 else soc
        status = "normal"
        if v >= 4.25 or v <= 2.5 or t >= 55 or t <= -10:
            status = "ov" if v >= 4.25 else "uv" if v <= 2.5 else "ot" if t >= 55 else "ut"
        cells.append(
            CellTelemetry(
                id=int(c.get("cell_id") or 0),
                v=round(v, 4),
                t=round(t, 2),
                balancing=bool(c.get("balancing")),
                soc=soc,
                soh=1.0,
                status=status,
            )
        )
    ts = rows[0].get("ts") if rows else datetime.now(timezone.utc).isoformat()
    return DashboardCellGrid(
        timestamp=ts or "",
        cells=cells,
        pack_mean_v=round(pack_mean_v, 4),
        pack_min_v=round(pack_min_v, 4),
        pack_max_v=round(pack_max_v, 4),
    ).model_dump()


@router.get("/cell-grid")
def get_cell_grid(
    dataset_key: str | None = Query(None),
    row_index: int = Query(0, ge=0),
    vehicle_id: int = Query(1, ge=1),
    db: Session = Depends(get_db),
):
    """Cell grid with backend-computed min/max and status. Uses DB when no dataset_key."""
    if dataset_key:
        grid = get_dashboard_cell_grid(dataset_key=dataset_key, row_index=row_index)
        if not grid:
            raise HTTPException(status_code=404, detail="No parquet data or dataset not found")
        return grid.model_dump()
    return _cell_grid_from_db(db, vehicle_id=vehicle_id)


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
    vehicle_id: int = Query(1, ge=1),
    hours: int = Query(168, ge=1, le=720),
    db: Session = Depends(get_db),
):
    """Active alarms with severity. Uses DB (alarm_event) when no dataset_key."""
    if dataset_key:
        alarms = get_dashboard_alarms(dataset_key=dataset_key, row_index=row_index)
        if not alarms:
            return {"alarms": [], "count": 0}
        return alarms.model_dump()
    since = datetime.now(timezone.utc) - timedelta(hours=hours)
    rows = get_active_alarms_db(db, vehicle_id=vehicle_id, since_ts=since, limit=200)
    alarm_list = [
        {
            "id": str(r["id"]),
            "severity": r.get("severity") or "info",
            "message": r.get("rationale") or r.get("alarm_type") or "",
        }
        for r in rows
    ]
    return DashboardAlarms(alarms=alarm_list, count=len(alarm_list)).model_dump()
