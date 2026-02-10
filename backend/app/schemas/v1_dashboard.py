"""
Pydantic schemas for API v1: dashboard-optimized and WebSocket payloads.
All computed on backend; frontend only renders.
"""

from datetime import datetime
from pydantic import BaseModel, Field


# ----- Pack / Cell (telemetry and WS) -----


class PackTelemetry(BaseModel):
    """Pack-level snapshot for dashboard and WS."""

    voltage: float = 0.0
    current: float = 0.0
    temp: float = 0.0
    soc: float = 0.0
    soh: float = 1.0
    min_cell_v: float = 0.0
    max_cell_v: float = 0.0
    status: str = "unknown"


class CellTelemetry(BaseModel):
    """Single cell for grid and WS."""

    id: int
    v: float = 0.0
    t: float = 0.0
    balancing: bool = False
    soc: float = 0.0
    soh: float = 1.0
    status: str = "normal"  # normal | ov | uv | ot | ut | imbalance


class BalancingStatus(BaseModel):
    """Which cells are currently balancing."""

    active_cell_ids: list[int] = Field(default_factory=list)
    max_active: int = 4
    policy_ok: bool = True


# ----- Dashboard API responses -----


class DashboardOverview(BaseModel):
    """GET /api/v1/dashboard/overview - single call for header/summary."""

    timestamp: str = ""
    dataset_key: str | None = None
    row_index: int | None = None
    pack: PackTelemetry = Field(default_factory=PackTelemetry)
    alarm_count: int = 0
    balancing_active_count: int = 0


class DashboardCellGrid(BaseModel):
    """GET /api/v1/dashboard/cell-grid - cells with min/max and status computed."""

    timestamp: str = ""
    cells: list[CellTelemetry] = Field(default_factory=list)
    pack_mean_v: float = 0.0
    pack_min_v: float = 0.0
    pack_max_v: float = 0.0


class DashboardBalancingStatus(BaseModel):
    """GET /api/v1/dashboard/balancing-status."""

    active_cell_ids: list[int] = Field(default_factory=list)
    max_active: int = 4
    detail: str = ""


class DashboardAlarms(BaseModel):
    """GET /api/v1/dashboard/alarms - active alarms with severity."""

    alarms: list[dict] = Field(default_factory=list)  # [{ "id": str, "severity": str, "message": str }]
    count: int = 0


# ----- Alarms API (list, detail, ack) -----


class AlarmEvidenceItem(BaseModel):
    """Single alarm_evidence row."""

    id: int
    alarm_id: int
    reason_type: str  # rule | model
    description: str | None = None
    rule_id: str | None = None
    rule_json: dict | None = None
    model_run_id: int | None = None
    model_name: str | None = None
    anomaly_score: float | None = None
    anomaly_threshold: float | None = None
    top_features: list | None = None
    created_at: str | None = None


class AlarmDetail(BaseModel):
    """GET /api/v1/alarms/{id} - alarm with evidence and recommended_action."""

    id: int
    vehicle_id: int | None = None
    module_id: int | None = None
    cell_id: int | None = None
    ts: str | None = None
    severity: str
    alarm_type: str
    value: float | None = None
    threshold: float | None = None
    rationale: str | None = None
    source: str | None = None
    acknowledged_at: str | None = None
    acknowledged_by: str | None = None
    evidence: list[AlarmEvidenceItem] = Field(default_factory=list)
    recommended_action: str = "Review cell and pack telemetry; acknowledge when resolved."


class AlarmAckBody(BaseModel):
    """POST /api/v1/alarms/{id}/ack body."""

    acknowledged_by: str | None = None


# ----- WebSocket payload (backend -> frontend) -----


class WsBmsPayload(BaseModel):
    """WS /api/v1/ws/bms stream message."""

    timestamp: str = ""
    pack: PackTelemetry = Field(default_factory=PackTelemetry)
    cells: list[CellTelemetry] = Field(default_factory=list)
    balancing: BalancingStatus = Field(default_factory=BalancingStatus)
    alarms: list[str] = Field(default_factory=list)  # list of alarm codes or messages
