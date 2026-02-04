"""
Plot API: GET /api/v1/plot/pack — pack timeseries for line chart.
"""
from fastapi import APIRouter, Request, Query, HTTPException
from sqlalchemy import text

router = APIRouter()

ALLOWED = {
    "pack_voltage": "pack_voltage",
    "pack_current": "pack_current",
    "pack_temp": "pack_temp",
    "ambient_temp": "ambient_temp",
    "soc": "soc",
    "soh": "soh",
}


@router.get("/pack")
def plot_pack(
    request: Request,
    vehicle_id: str = Query(..., description="BMS vehicle id"),
    metric: str = Query("pack_voltage", description="Metric column name"),
    window: int = Query(600, description="Window in seconds (used as point limit hint)"),
):
    if metric not in ALLOWED:
        raise HTTPException(
            400,
            detail=f"metric must be one of: {list(ALLOWED.keys())}",
        )

    col = ALLOWED[metric]
    engine = request.app.state.engine

    # window seconds → point limit (e.g. 2 Hz → window*2 points)
    limit = max(50, min(5000, window * 2))

    q = text(f"""
        SELECT ts, {col} AS value
        FROM pack_timeseries
        WHERE vehicle_id = :vid
        ORDER BY ts DESC
        LIMIT :lim
    """)

    with engine.connect() as conn:
        rows = conn.execute(q, {"vid": vehicle_id, "lim": limit}).mappings().all()

    # Return chronological order for chart
    pts = [
        {"ts": r["ts"].isoformat(), "value": float(r["value"])}
        for r in reversed(rows)
        if r["value"] is not None
    ]
    return {"metric": metric, "points": pts}
