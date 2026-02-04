"""Cell grid API: E1~E18 타일 (voltage / temperature / resistance)."""

from fastapi import APIRouter, Query

from app.core.config import settings
from app.services.feature_store import FeatureStore

router = APIRouter()
fs = FeatureStore(settings.feature_dir, settings.timeseries_dir)


@router.get("/cells/grid")
def cells_grid(
    pack_id: str = Query("B0005"),
    module: int = Query(1),
    metric: str = Query("voltage", description="voltage | temperature | resistance"),
):
    """
    Cell grid: 최신 timestamp 기준 cell별 값.
    cell_timeseries.parquet 컬럼: pack_id, ts, cell_id, v_cell, t_cell, r_cell(optional), balancing(optional).
    """
    df = fs.cell_timeseries(pack_id)
    if df.empty:
        return {
            "pack_id": pack_id,
            "module": module,
            "metric": metric,
            "cells": [],
            "min": 0.0,
            "max": 0.0,
        }

    if "ts" in df.columns:
        last_ts = df["ts"].max()
        snap = df[df["ts"] == last_ts].copy()
    else:
        snap = df.tail(18).copy()

    snap = snap.head(18)

    if metric == "temperature":
        val_col = "t_cell" if "t_cell" in snap.columns else "v_cell"
        vals = snap[val_col].astype(float)
    elif metric == "resistance":
        val_col = "r_cell" if "r_cell" in snap.columns else "v_cell"
        vals = snap[val_col].astype(float) if val_col in snap.columns else snap["v_cell"].astype(float) * 0
    else:
        val_col = "v_cell" if "v_cell" in snap.columns else "voltage"
        vals = snap[val_col].astype(float)

    vmin, vmax = float(vals.min()), float(vals.max())
    cell_id_col = "cell_id" if "cell_id" in snap.columns else snap.columns[0]

    cells = []
    for _, r in snap.iterrows():
        if metric == "temperature":
            value = float(r.get("t_cell", r.get("v_cell", 0)))
        elif metric == "resistance":
            value = float(r.get("r_cell", r.get("v_cell", 0)))
        else:
            value = float(r.get("v_cell", r.get("voltage", 0)))
        cells.append({
            "cell_id": str(r.get(cell_id_col, "E?")),
            "value": value,
            "status": "OK",
            "balancing": bool(r.get("balancing", False)),
        })

    return {
        "pack_id": pack_id,
        "module": module,
        "metric": metric,
        "cells": cells,
        "min": vmin,
        "max": vmax,
    }
