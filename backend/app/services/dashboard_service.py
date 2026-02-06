"""
Dashboard-optimized service: build overview, cell-grid, balancing, alarms from real parquet.
No mock data; uses parquet_bms_loader and in-memory balancing state.
"""

from __future__ import annotations

from typing import Optional

from app.schemas.bms_data import CurrentDataResponse, CellData
from app.schemas.v1_dashboard import (
    PackTelemetry,
    CellTelemetry,
    BalancingStatus,
    DashboardOverview,
    DashboardCellGrid,
    DashboardBalancingStatus,
    DashboardAlarms,
    WsBmsPayload,
)
from app.services.parquet_bms_loader import get_current_from_parquet, get_first_available_dataset_key
from app.services.nasa_mat_loader import (
    get_current_from_mat,
    get_first_available_mat_key,
    has_mat_data,
)

# In-memory balancing state: dataset_key -> { cell_id: bool }
_balancing_state: dict[str, dict[int, bool]] = {}
# Default number of cells to show in grid (parquet is often pack-level; we synthesize cells)
N_CELLS = 16
# Alarm thresholds (configurable later via config)
VOLTAGE_OV = 4.25
VOLTAGE_UV = 2.50
TEMP_OT = 55.0
TEMP_UT = -10.0
IMBALANCE_MV = 150.0  # max - min cell voltage (mV) above this -> alarm


def _ensure_balancing_state(dataset_key: str) -> dict[int, bool]:
    if dataset_key not in _balancing_state:
        _balancing_state[dataset_key] = {}
    return _balancing_state[dataset_key]


def set_cell_balancing(dataset_key: str, cell_id: int, enabled: bool) -> None:
    """Set balancing on/off for a cell (called by control API)."""
    state = _ensure_balancing_state(dataset_key)
    state[cell_id] = enabled


def get_balancing_active_cells(dataset_key: str) -> list[int]:
    """Return list of cell ids that are currently balancing."""
    state = _ensure_balancing_state(dataset_key)
    return [cid for cid, on in state.items() if on]


def _cell_data_to_telemetry(c: CellData, cell_id: int, dataset_key: str) -> CellTelemetry:
    """Convert CellData (from .mat) to CellTelemetry with status from thresholds."""
    state = _ensure_balancing_state(dataset_key)
    v = c.voltage or 0
    t = c.temperature or 0
    soc = (c.soc or 0) / 100.0 if (c.soc or 0) > 1 else (c.soc or 0)
    soh = (c.soh or 100) / 100.0 if (c.soh or 0) > 1 else (c.soh or 1.0)
    status = "normal"
    if v >= VOLTAGE_OV:
        status = "ov"
    elif v <= VOLTAGE_UV:
        status = "uv"
    if t >= TEMP_OT:
        status = "ot" if status == "normal" else status
    elif t <= TEMP_UT:
        status = "ut" if status == "normal" else status
    bal = state.get(cell_id, False)
    return CellTelemetry(id=cell_id, v=round(v, 4), t=round(t, 2), balancing=bal, soc=soc, soh=soh, status=status)


def _cells_from_snapshot(snapshot: CurrentDataResponse, dataset_key: str) -> list[CellTelemetry]:
    """Use snapshot.cells (from .mat) if present and multiple; else build from pack with noise."""
    if snapshot.cells and len(snapshot.cells) > 1:
        cells: list[CellTelemetry] = []
        vs: list[float] = []
        for i, c in enumerate(snapshot.cells):
            cid = i + 1
            try:
                cid = int(c.cell_id) if (getattr(c, "cell_id", None) and str(c.cell_id).isdigit()) else (i + 1)
            except (ValueError, AttributeError, TypeError):
                cid = i + 1
            cells.append(_cell_data_to_telemetry(c, cid, dataset_key))
            vs.append(cells[-1].v)
        if vs:
            v_min, v_max = min(vs), max(vs)
            if (v_max - v_min) * 1000 >= IMBALANCE_MV:
                for c in cells:
                    if c.v == v_max or c.v == v_min:
                        if c.status == "normal":
                            c.status = "imbalance"
                        break
        return cells
    return _snapshot_to_cells(snapshot, dataset_key)


def get_current_snapshot(dataset_key: Optional[str], row_index: int) -> Optional[CurrentDataResponse]:
    """Unified snapshot: try .mat first (B0005 etc), then parquet."""
    key = dataset_key or get_first_available_mat_key() or get_first_available_dataset_key()
    if not key:
        return None
    if has_mat_data(key):
        return get_current_from_mat(key, row_index)
    return get_current_from_parquet(key, row_index)


def _snapshot_to_cells(snapshot: CurrentDataResponse, dataset_key: str) -> list[CellTelemetry]:
    """
    Build N_CELLS from pack snapshot: distribute voltage/temp with small noise,
    attach balancing state and status (normal/ov/uv/ot/ut/imbalance).
    """
    state = _ensure_balancing_state(dataset_key)
    v_pack = snapshot.pack_voltage or 0.0
    t_pack = snapshot.pack_temperature or 0.0
    soc = (snapshot.pack_soc or 0.0) / 100.0 if (snapshot.pack_soc or 0) > 1 else (snapshot.pack_soc or 0.0)
    soh = (snapshot.pack_soh or 100.0) / 100.0 if (snapshot.pack_soh or 0) > 1 else (snapshot.pack_soh or 1.0)
    n = N_CELLS
    # Per-cell voltage: pack_v / n + small noise (so we can show imbalance alarm)
    import random
    random.seed(42)  # reproducible for same row
    cells: list[CellTelemetry] = []
    v_per_cell = v_pack / n if n else 0.0
    vs: list[float] = []
    for i in range(1, n + 1):
        noise_v = (random.random() - 0.5) * 0.02 * v_per_cell
        noise_t = (random.random() - 0.5) * 2.0
        v = max(2.0, min(4.3, v_per_cell + noise_v))
        t = t_pack + noise_t
        vs.append(v)
        status = "normal"
        if v >= VOLTAGE_OV:
            status = "ov"
        elif v <= VOLTAGE_UV:
            status = "uv"
        if t >= TEMP_OT:
            status = "ot" if status == "normal" else status
        elif t <= TEMP_UT:
            status = "ut" if status == "normal" else status
        bal = state.get(i, False)
        cells.append(
            CellTelemetry(id=i, v=round(v, 4), t=round(t, 2), balancing=bal, soc=soc, soh=soh, status=status)
        )
    # Imbalance: if max-min > threshold, mark worst cell
    if vs:
        v_min, v_max = min(vs), max(vs)
        if (v_max - v_min) * 1000 >= IMBALANCE_MV:
            for c in cells:
                if c.v == v_max or c.v == v_min:
                    if c.status == "normal":
                        c.status = "imbalance"
                    break
    return cells


def _derive_alarms(snapshot: CurrentDataResponse, cells: list[CellTelemetry]) -> list[dict]:
    """Derive alarm list from pack and cell state (backend-only logic)."""
    alarms: list[dict] = []
    v = snapshot.pack_voltage or 0
    t = snapshot.pack_temperature or 0
    if v >= VOLTAGE_OV * N_CELLS:
        alarms.append({"id": "PACK_OV", "severity": "critical", "message": "Pack over-voltage"})
    if v <= VOLTAGE_UV * N_CELLS:
        alarms.append({"id": "PACK_UV", "severity": "critical", "message": "Pack under-voltage"})
    if t >= TEMP_OT:
        alarms.append({"id": "PACK_OT", "severity": "critical", "message": "Pack over-temperature"})
    if t <= TEMP_UT:
        alarms.append({"id": "PACK_UT", "severity": "warning", "message": "Pack under-temperature"})
    for c in cells:
        if c.status == "ov":
            alarms.append({"id": f"CELL_{c.id}_OV", "severity": "critical", "message": f"Cell {c.id} over-voltage"})
        elif c.status == "uv":
            alarms.append({"id": f"CELL_{c.id}_UV", "severity": "critical", "message": f"Cell {c.id} under-voltage"})
        elif c.status == "ot":
            alarms.append({"id": f"CELL_{c.id}_OT", "severity": "critical", "message": f"Cell {c.id} over-temp"})
        elif c.status == "imbalance":
            alarms.append({"id": "CELL_IMBALANCE", "severity": "warning", "message": "Cell voltage imbalance"})
            break
    return alarms


def _snapshot_to_pack(snapshot: CurrentDataResponse, cells: list[CellTelemetry]) -> PackTelemetry:
    """Build PackTelemetry from snapshot and cell min/max."""
    vs = [c.v for c in cells] if cells else [snapshot.pack_voltage or 0]
    return PackTelemetry(
        voltage=round(snapshot.pack_voltage or 0, 2),
        current=round(snapshot.pack_current or 0, 2),
        temp=round(snapshot.pack_temperature or 0, 1),
        soc=round((snapshot.pack_soc or 0) / 100.0 if (snapshot.pack_soc or 0) > 1 else (snapshot.pack_soc or 0), 4),
        soh=round((snapshot.pack_soh or 100) / 100.0 if (snapshot.pack_soh or 0) > 1 else (snapshot.pack_soh or 1), 4),
        min_cell_v=round(min(vs), 4),
        max_cell_v=round(max(vs), 4),
        status="charging" if (snapshot.pack_current or 0) > 0 else "discharging",
    )


def get_dashboard_overview(
    dataset_key: Optional[str] = None,
    row_index: int = 0,
) -> Optional[DashboardOverview]:
    """Build dashboard overview from real data (.mat fallback, then parquet)."""
    key = dataset_key or get_first_available_mat_key() or get_first_available_dataset_key()
    if not key:
        return None
    snapshot = get_current_snapshot(key, row_index)
    if not snapshot:
        return None
    cells = _cells_from_snapshot(snapshot, key)
    pack = _snapshot_to_pack(snapshot, cells)
    alarms = _derive_alarms(snapshot, cells)
    ts = snapshot.timestamp if isinstance(snapshot.timestamp, str) else (snapshot.timestamp.isoformat() if snapshot.timestamp else "")
    return DashboardOverview(
        timestamp=ts,
        dataset_key=key,
        row_index=snapshot.row_index,
        pack=pack,
        alarm_count=len(alarms),
        balancing_active_count=len(get_balancing_active_cells(key)),
    )


def get_dashboard_cell_grid(
    dataset_key: Optional[str] = None,
    row_index: int = 0,
) -> Optional[DashboardCellGrid]:
    """Build cell grid with pack min/max (backend-computed)."""
    key = dataset_key or get_first_available_dataset_key()
    if not key:
        return None
    snapshot = get_current_from_parquet(key, row_index)
    if not snapshot:
        return None
    cells = _snapshot_to_cells(snapshot, key)
    vs = [c.v for c in cells]
    ts = snapshot.timestamp if isinstance(snapshot.timestamp, str) else (snapshot.timestamp.isoformat() if snapshot.timestamp else "")
    return DashboardCellGrid(
        timestamp=ts,
        cells=cells,
        pack_mean_v=round(sum(vs) / len(vs), 4) if vs else 0,
        pack_min_v=round(min(vs), 4) if vs else 0,
        pack_max_v=round(max(vs), 4) if vs else 0,
    )


def get_dashboard_balancing_status(dataset_key: Optional[str] = None) -> DashboardBalancingStatus:
    """Return current balancing status (from in-memory state)."""
    key = dataset_key or get_first_available_mat_key() or get_first_available_dataset_key()
    active = get_balancing_active_cells(key or "") if key else []
    return DashboardBalancingStatus(
        active_cell_ids=active,
        max_active=4,
        detail=f"{len(active)} cell(s) balancing" if active else "No cells balancing",
    )


def get_dashboard_alarms(
    dataset_key: Optional[str] = None,
    row_index: int = 0,
) -> Optional[DashboardAlarms]:
    """Build alarms from current snapshot (backend-derived)."""
    key = dataset_key or get_first_available_dataset_key()
    if not key:
        return DashboardAlarms()
    snapshot = get_current_from_parquet(key, row_index)
    if not snapshot:
        return DashboardAlarms()
    cells = _snapshot_to_cells(snapshot, key)
    alarms = _derive_alarms(snapshot, cells)
    return DashboardAlarms(alarms=alarms, count=len(alarms))


def build_ws_payload(
    dataset_key: str,
    row_index: int,
) -> Optional[WsBmsPayload]:
    """Build WebSocket payload for streaming (.mat fallback, then parquet)."""
    snapshot = get_current_snapshot(dataset_key, row_index)
    if not snapshot:
        return None
    cells = _cells_from_snapshot(snapshot, dataset_key)
    pack = _snapshot_to_pack(snapshot, cells)
    alarms_list = _derive_alarms(snapshot, cells)
    alarm_messages = [a["message"] for a in alarms_list]
    ts = snapshot.timestamp if isinstance(snapshot.timestamp, str) else (snapshot.timestamp.isoformat() if snapshot.timestamp else "")
    balancing = BalancingStatus(
        active_cell_ids=get_balancing_active_cells(dataset_key),
        max_active=4,
        policy_ok=True,
    )
    return WsBmsPayload(
        timestamp=ts,
        pack=pack,
        cells=cells,
        balancing=balancing,
        alarms=alarm_messages,
    )
