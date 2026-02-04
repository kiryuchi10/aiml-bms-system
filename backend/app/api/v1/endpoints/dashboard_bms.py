"""
BMS Dashboard: GET /vehicle/{vehicle_id}, /vehicle/{vehicle_id}/pack-view.
Uses real parquet-derived data from bms_store (pack_timeseries, cell_timeseries, alarms).
Contract: pack/cells/alarms/learnings for UI; pack-view for cell grid.
"""
from fastapi import APIRouter, Request, HTTPException

router = APIRouter()


@router.get("/vehicle/{vehicle_id}")
def get_vehicle_dashboard(vehicle_id: str, request: Request):
    """Full dashboard: pack, cells, alarms, learnings. REST initial load."""
    store = getattr(request.app.state, "bms_store", None)
    if not store:
        raise HTTPException(status_code=503, detail="BMS store not initialized")

    pack = store.get_latest_pack(vehicle_id)
    if not pack:
        raise HTTPException(status_code=404, detail="vehicle pack data not found")

    cells, _ = store.get_latest_cells(vehicle_id, ts=pack["ts"])
    alarms = store.get_alarms(vehicle_id)
    learnings = store.get_learnings(vehicle_id)

    # Apply same balancing/alarm derivation as streamer for consistency
    from app.services.bms_streamer import Streamer
    cells_out = Streamer._apply_passive_balancing(pack, list(cells))
    alarms_out = Streamer._derive_alarms(pack, cells_out)

    return {
        "vehicle_id": vehicle_id,
        "pack": {
            "voltage": pack.get("pack_voltage"),
            "current": pack.get("pack_current"),
            "soc": pack.get("soc"),
            "soh": pack.get("soh"),
            "pack_temp": pack.get("pack_temp"),
            "ambient_temp": pack.get("ambient_temp"),
            "mode": pack.get("mode") or "Idle",
            "ts": pack["ts"].isoformat() if pack.get("ts") else None,
        },
        "cells": [
            {
                "id": c.get("id"),
                "v": c.get("v"),
                "t": c.get("t"),
                "i": c.get("i"),
                "soc": c.get("abs_soc"),
                "soh": c.get("soh"),
                "bal": bool(c.get("bal")),
                "alarm": bool(c.get("alarm")),
            }
            for c in cells_out
        ],
        "alarms": alarms_out,
        "learnings": learnings,
    }


@router.get("/vehicle/{vehicle_id}/pack-view")
def get_pack_view(vehicle_id: str, request: Request):
    """Pack view: ts, min/max cell V, cells for grid."""
    store = getattr(request.app.state, "bms_store", None)
    if not store:
        raise HTTPException(status_code=503, detail="BMS store not initialized")

    pack = store.get_latest_pack(vehicle_id)
    if not pack:
        raise HTTPException(status_code=404, detail="vehicle not found")

    cells, _ = store.get_latest_cells(vehicle_id, ts=pack["ts"])
    from app.services.bms_streamer import Streamer
    cells_out = Streamer._apply_passive_balancing(pack, list(cells))
    Streamer._derive_alarms(pack, cells_out)

    vs = [c["v"] for c in cells_out if c.get("v") is not None]
    return {
        "vehicle_id": vehicle_id,
        "ts": pack["ts"].isoformat(),
        "min_cell_v": min(vs) if vs else None,
        "max_cell_v": max(vs) if vs else None,
        "cells": [
            {"id": c.get("id"), "v": c.get("v"), "t": c.get("t"), "bal": bool(c.get("bal")), "alarm": bool(c.get("alarm"))}
            for c in cells_out
        ],
    }
