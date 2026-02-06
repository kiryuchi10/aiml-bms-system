"""
Telemetry API: pack, module, cell, cell/grid from real parquet.
GET /api/v1/telemetry/pack
GET /api/v1/telemetry/module/{id}
GET /api/v1/telemetry/cell/{id}
GET /api/v1/telemetry/cell/grid
"""

from fastapi import APIRouter, Query, HTTPException

from app.services.dashboard_service import (
    get_dashboard_overview,
    get_dashboard_cell_grid,
)

router = APIRouter()


@router.get("/pack")
def get_telemetry_pack(
    dataset_key: str | None = Query(None),
    row_index: int = Query(0, ge=0),
):
    """Pack-level telemetry (voltage, current, temp, soc, soh, min/max cell V)."""
    overview = get_dashboard_overview(dataset_key=dataset_key, row_index=row_index)
    if not overview:
        raise HTTPException(status_code=404, detail="No parquet data or dataset not found")
    return overview.pack.model_dump()


@router.get("/module/{module_id}")
def get_telemetry_module(
    module_id: int,
    dataset_key: str | None = Query(None),
    row_index: int = Query(0, ge=0),
):
    """Module-level: for now same as pack (single module)."""
    overview = get_dashboard_overview(dataset_key=dataset_key, row_index=row_index)
    if not overview:
        raise HTTPException(status_code=404, detail="No parquet data or dataset not found")
    return {"module_id": module_id, "pack": overview.pack.model_dump()}


@router.get("/cell/{cell_id}")
def get_telemetry_cell(
  cell_id: int,
  dataset_key: str | None = Query(None),
  row_index: int = Query(0, ge=0),
):
    """Single cell telemetry (id, v, t, balancing, status)."""
    grid = get_dashboard_cell_grid(dataset_key=dataset_key, row_index=row_index)
    if not grid:
        raise HTTPException(status_code=404, detail="No parquet data or dataset not found")
    cell = next((c for c in grid.cells if c.id == cell_id), None)
    if not cell:
        raise HTTPException(status_code=404, detail=f"Cell {cell_id} not found")
    return cell.model_dump()


@router.get("/cell/grid")
def get_telemetry_cell_grid(
    dataset_key: str | None = Query(None),
    row_index: int = Query(0, ge=0),
):
    """Full cell grid for frontend (cells + pack mean/min/max)."""
    grid = get_dashboard_cell_grid(dataset_key=dataset_key, row_index=row_index)
    if not grid:
        raise HTTPException(status_code=404, detail="No parquet data or dataset not found")
    return grid.model_dump()
