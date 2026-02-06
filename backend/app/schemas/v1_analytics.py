"""Pydantic schemas for API v1 analytics (SOC/SOH proxy, thermal, risk)."""

from pydantic import BaseModel, Field


class AnalyticsSoc(BaseModel):
    """GET /api/v1/analytics/soc - SOC proxy from current data."""

    soc: float = Field(..., ge=0, le=1)
    soc_percent: float = 0.0
    source: str = "parquet"  # parquet | model
    timestamp: str = ""


class AnalyticsSoh(BaseModel):
    """GET /api/v1/analytics/soh - SOH proxy."""

    soh: float = Field(..., ge=0, le=1)
    soh_percent: float = 0.0
    source: str = "parquet"
    timestamp: str = ""


class AnalyticsThermal(BaseModel):
    """GET /api/v1/analytics/thermal - pack/cell thermal summary."""

    pack_temp: float = 0.0
    min_cell_temp: float = 0.0
    max_cell_temp: float = 0.0
    status: str = "normal"  # normal | warning | critical
    timestamp: str = ""


class AnalyticsRisk(BaseModel):
    """GET /api/v1/analytics/risk - simple risk score from thresholds."""

    score: float = Field(..., ge=0, le=1)  # 0=ok, 1=high risk
    factors: list[str] = Field(default_factory=list)
    timestamp: str = ""
