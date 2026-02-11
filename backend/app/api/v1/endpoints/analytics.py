"""
Analytics API: SOC/SOH proxy and time-series, thermal, aging, risk.
"""

from fastapi import APIRouter, Query, HTTPException

from app.services.analytics_service import (
    get_analytics_soc,
    get_analytics_soh,
    get_analytics_thermal,
    get_analytics_risk,
    get_analytics_soc_trend,
    get_analytics_soh_trend,
    get_analytics_thermal_map as get_thermal_map_svc,
    get_analytics_aging_map,
    get_analytics_anomaly_timeline,
)

router = APIRouter()


@router.get("/soc")
def get_soc(
    dataset_key: str | None = Query(None),
    row_index: int = Query(0, ge=0),
    hours: int | None = Query(None, ge=1, le=168, description="If set, return time-series for last N hours"),
):
    """SOC proxy from current snapshot; or time-series if hours=24."""
    if hours is not None:
        trend = get_analytics_soc_trend(dataset_key=dataset_key, hours=hours)
        if not trend:
            raise HTTPException(status_code=404, detail="No data or dataset not found")
        return trend
    out = get_analytics_soc(dataset_key=dataset_key, row_index=row_index)
    if not out:
        raise HTTPException(status_code=404, detail="No data or dataset not found")
    return out.model_dump()


@router.get("/soh")
def get_soh(
    dataset_key: str | None = Query(None),
    row_index: int = Query(0, ge=0),
    days: int | None = Query(None, ge=1, le=365, description="If set, return time-series for last N days (demo proxy)"),
):
    """SOH proxy from current snapshot; or time-series if days=30."""
    if days is not None:
        trend = get_analytics_soh_trend(dataset_key=dataset_key, days=days)
        if not trend:
            raise HTTPException(status_code=404, detail="No data or dataset not found")
        return trend
    out = get_analytics_soh(dataset_key=dataset_key, row_index=row_index)
    if not out:
        raise HTTPException(status_code=404, detail="No data or dataset not found")
    return out.model_dump()


@router.get("/thermal")
def get_thermal(
    dataset_key: str | None = Query(None),
    row_index: int = Query(0, ge=0),
):
    """Thermal summary: pack/cell min/max temp, status."""
    out = get_analytics_thermal(dataset_key=dataset_key, row_index=row_index)
    if not out:
        raise HTTPException(status_code=404, detail="No data or dataset not found")
    return out.model_dump()


@router.get("/thermal-map")
def get_thermal_map(
    dataset_key: str | None = Query(None),
    row_index: int = Query(0, ge=0),
):
    """Thermal snapshot for heatmap: rows, cols, values, status."""
    out = get_thermal_map_svc(dataset_key=dataset_key, row_index=row_index)
    if not out:
        raise HTTPException(status_code=404, detail="No data or dataset not found")
    return out


@router.get("/aging")
def get_aging(
    dataset_key: str | None = Query(None),
    row_index: int = Query(0, ge=0),
):
    """Aging index proxy (snapshot for heatmap)."""
    out = get_analytics_aging_map(dataset_key=dataset_key, row_index=row_index)
    if not out:
        raise HTTPException(status_code=404, detail="No data or dataset not found")
    return out


@router.get("/risk")
def get_risk(
    dataset_key: str | None = Query(None),
    row_index: int = Query(0, ge=0),
):
    """Simple risk score and contributing factors."""
    out = get_analytics_risk(dataset_key=dataset_key, row_index=row_index)
    if not out:
        raise HTTPException(status_code=404, detail="No data or dataset not found")
    return out.model_dump()


@router.get("/anomaly")
def get_anomaly(
    dataset_key: str | None = Query(None),
    limit: int = Query(500, ge=1, le=2000),
):
    """Anomaly score timeline from soh_features.parquet (no mock). Returns { points: [{ cycle, score }], days }."""
    return get_analytics_anomaly_timeline(dataset_key=dataset_key, limit=limit)
