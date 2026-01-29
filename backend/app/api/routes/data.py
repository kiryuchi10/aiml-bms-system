"""BMS real-time data from parquet: current snapshot and dataset list."""

from fastapi import APIRouter, Query, HTTPException

from app.schemas.bms_data import (
    CurrentDataResponse,
    DatasetsListResponse,
)
from app.services.parquet_bms_loader import (
    list_parquet_datasets,
    get_current_from_parquet,
    get_first_available_dataset_key,
)

router = APIRouter()


@router.get("/data/current", response_model=CurrentDataResponse)
def get_current_data(
    dataset_key: str | None = Query(
        None,
        description="Parquet dataset key (filename stem). Default: first file in data dir.",
    ),
    row_index: int = Query(
        0,
        ge=0,
        description="Row index for playback (0-based). Used for real-time simulation.",
    ),
) -> CurrentDataResponse:
    """
    Get current BMS snapshot from parquet data.
    Use row_index to simulate real-time playback (e.g. increment each second).
    """
    key = dataset_key or get_first_available_dataset_key()
    if not key:
        raise HTTPException(
            status_code=404,
            detail="No parquet datasets in data directory. Add a .parquet file to backend/data.",
        )
    snapshot = get_current_from_parquet(key, row_index)
    if snapshot is None:
        raise HTTPException(
            status_code=404,
            detail=f"Dataset not found or empty: {key}",
        )
    return snapshot


@router.get("/datasets", response_model=DatasetsListResponse)
def list_datasets() -> DatasetsListResponse:
    """List available parquet datasets in backend/data for BMS real-time operation."""
    return list_parquet_datasets()
