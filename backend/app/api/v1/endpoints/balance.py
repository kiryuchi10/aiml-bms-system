"""
Balance API: GET /policy (safety limits), POST /set (toggle with server-side rule enforcement).
Same rules as frontend: temp limit, min delta mV, max active balancing cells.
OFF always allowed; ON denied if any rule fails.
"""
from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel

router = APIRouter()

# Default policy (real BMS–like)
DEFAULT_POLICY = {"max_active": 4, "min_delta_mv": 10, "temp_limit_c": 45}


class BalancePolicyResponse(BaseModel):
    max_active: int
    min_delta_mv: float
    temp_limit_c: float


class BalanceSetRequest(BaseModel):
    vehicle_id: str
    cell_id: int
    enabled: bool


class BalanceSetResponse(BaseModel):
    ok: bool
    cell_id: int
    enabled: bool
    reason: str | None = None
    detail: str | None = None


@router.get("/policy", response_model=BalancePolicyResponse)
def get_balance_policy() -> BalancePolicyResponse:
    """Return balancing safety policy (max_active, min_delta_mv, temp_limit_c)."""
    return BalancePolicyResponse(
        max_active=DEFAULT_POLICY["max_active"],
        min_delta_mv=float(DEFAULT_POLICY["min_delta_mv"]),
        temp_limit_c=float(DEFAULT_POLICY["temp_limit_c"]),
    )


@router.post("/set", response_model=BalanceSetResponse)
def set_balance(request: Request, body: BalanceSetRequest) -> BalanceSetResponse:
    """Toggle cell balancing. OFF always allowed; ON enforced by temp, delta, max_active."""
    if body.enabled is False:
        return BalanceSetResponse(ok=True, cell_id=body.cell_id, enabled=False)

    store = request.app.state.bms_store
    cells, _ = store.get_latest_cells(body.vehicle_id)
    if not cells:
        return BalanceSetResponse(
            ok=False,
            cell_id=body.cell_id,
            enabled=False,
            reason="NO_DATA",
            detail="No cell data for vehicle",
        )

    cell = next((c for c in cells if c.get("id") == body.cell_id), None)
    if not cell:
        return BalanceSetResponse(
            ok=False,
            cell_id=body.cell_id,
            enabled=False,
            reason="NO_CELL",
            detail=f"Cell {body.cell_id} not found",
        )

    temp_limit_c = DEFAULT_POLICY["temp_limit_c"]
    min_delta_mv = DEFAULT_POLICY["min_delta_mv"]
    max_active = DEFAULT_POLICY["max_active"]

    t = cell.get("t")
    if t is not None and t > temp_limit_c:
        return BalanceSetResponse(
            ok=False,
            cell_id=body.cell_id,
            enabled=False,
            reason="TEMP_LIMIT",
            detail=f"Cell temp {t:.1f}°C > {temp_limit_c}°C",
        )

    vs = [c.get("v") for c in cells if c.get("v") is not None]
    if not vs:
        return BalanceSetResponse(
            ok=False,
            cell_id=body.cell_id,
            enabled=False,
            reason="NO_DATA",
            detail="No voltage data",
        )
    mean_v = sum(vs) / len(vs)
    cell_v = cell.get("v")
    if cell_v is not None:
        delta_mv = abs((cell_v - mean_v) * 1000)
        if delta_mv < min_delta_mv:
            return BalanceSetResponse(
                ok=False,
                cell_id=body.cell_id,
                enabled=False,
                reason="DELTA_TOO_SMALL",
                detail=f"|V - mean| = {delta_mv:.1f}mV < {min_delta_mv}mV",
            )

    active_count = sum(1 for c in cells if c.get("bal"))
    if active_count >= max_active:
        return BalanceSetResponse(
            ok=False,
            cell_id=body.cell_id,
            enabled=False,
            reason="MAX_ACTIVE",
            detail=f"Active balancing cells ({active_count}) >= limit ({max_active})",
        )

    return BalanceSetResponse(ok=True, cell_id=body.cell_id, enabled=True)
