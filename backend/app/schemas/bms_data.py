"""Pydantic schemas for BMS real-time and historical data (parquet-backed)."""

from datetime import datetime
from pydantic import BaseModel, Field


class CellData(BaseModel):
    """Single cell snapshot for BMS current data."""

    cell_id: str = "01"
    voltage: float = 0.0
    temperature: float = 0.0
    current: float = 0.0
    soc: float = 0.0
    soh: float = 100.0
    is_active: bool = True


class CurrentDataResponse(BaseModel):
    """Response for GET /api/data/current - BMS snapshot from parquet row."""

    timestamp: datetime | str = Field(..., description="Sample time or row index label")
    pack_voltage: float = 0.0
    pack_current: float = 0.0
    pack_temperature: float = 0.0
    ambient_temperature: float = 0.0
    pack_soc: float = 0.0
    pack_soh: float = 100.0
    operation_mode: str = "discharging"
    cells: list[CellData] = Field(default_factory=list)
    row_index: int | None = Field(None, description="Parquet row index for playback")
    dataset_key: str | None = Field(None, description="Source dataset / parquet key")


class DatasetInfo(BaseModel):
    """Info for one parquet dataset in backend/data."""

    key: str = Field(..., description="Filename stem or dataset key")
    name: str = ""
    path: str = ""
    rows: int = 0
    columns: list[str] = Field(default_factory=list)


class DatasetsListResponse(BaseModel):
    """Response for GET /api/datasets - list available parquet datasets."""

    datasets: list[DatasetInfo] = Field(default_factory=list)
