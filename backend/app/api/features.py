"""Features API: soc/soh/eis/thermal parquet 요약 서빙 (프론트는 JSON만 받음)."""

from fastapi import APIRouter, Query

from app.core.config import settings
from app.services.feature_store import FeatureStore

router = APIRouter()
fs = FeatureStore(settings.feature_dir, settings.timeseries_dir)


@router.get("/features/soc")
def get_soc_features(
    pack_id: str = Query("B0005"),
    cycle_id: int = Query(1),
):
    df = fs.soc_features(pack_id, cycle_id)
    return {"pack_id": pack_id, "cycle_id": cycle_id, "rows": df.to_dict(orient="records")}


@router.get("/features/soh")
def get_soh_features(pack_id: str = Query("B0005")):
    df = fs.soh_features(pack_id)
    return {"pack_id": pack_id, "rows": df.to_dict(orient="records")}


@router.get("/features/eis")
def get_eis_features(
    pack_id: str = Query("B0005"),
    cycle_id: int = Query(1),
):
    df = fs.eis_features(pack_id, cycle_id)
    return {"pack_id": pack_id, "cycle_id": cycle_id, "rows": df.to_dict(orient="records")}


@router.get("/features/thermal")
def get_thermal_features(pack_id: str = Query("B0005")):
    df = fs.thermal_features(pack_id)
    return {"pack_id": pack_id, "rows": df.to_dict(orient="records")}
