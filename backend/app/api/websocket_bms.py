"""WebSocket endpoint for BMS real-time streaming (.mat fallback, then parquet)."""

import asyncio
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query

from app.services.dashboard_service import build_ws_payload
from app.services.nasa_mat_loader import (
    get_first_available_mat_key,
    has_mat_data,
    get_mat_row_count,
)
from app.services.parquet_bms_loader import (
    get_first_available_dataset_key,
    load_parquet_frame,
)

ws_router = APIRouter()


def _total_rows(key: str) -> int:
    """Row count for dataset (mat or parquet)."""
    if has_mat_data(key):
        return get_mat_row_count(key)
    frame = load_parquet_frame(key)
    if frame is None:
        return 0
    return len(frame[0])


@ws_router.websocket("/ws/bms")
async def websocket_bms_stream(
    websocket: WebSocket,
    dataset: str | None = Query(None, description="Dataset key (e.g. B0005)"),
    dataset_key: str | None = Query(None, description="Alias for dataset"),
    hz: float = Query(1, ge=0.1, le=10, description="Tick rate per second"),
    interval_ms: int | None = Query(None, ge=100, le=60000),
) -> None:
    """
    Stream BMS snapshots: snapshot → tick loop.
    Connect: ws://host/ws/bms?dataset=B0005&hz=1
    Uses .mat when available (e.g. backend/data/B0005.mat), else parquet.
    """
    await websocket.accept()
    key = dataset or dataset_key or get_first_available_mat_key() or get_first_available_dataset_key()
    if not key:
        await websocket.send_json({"error": "No datasets in data directory (.mat or .parquet)"})
        await websocket.close()
        return

    total_rows = _total_rows(key)
    if total_rows == 0:
        await websocket.send_json({"error": f"Dataset empty or not found: {key}"})
        await websocket.close()
        return

    # hz=1 -> 1000ms; interval_ms overrides
    if interval_ms is not None:
        interval_sec = interval_ms / 1000.0
    else:
        interval_sec = 1.0 / hz

    await websocket.send_json({
        "type": "connection",
        "status": "connected",
        "dataset_key": key,
        "dataset": key,
        "total_rows": total_rows,
        "hz": hz,
        "interval_ms": int(interval_sec * 1000),
    })

    row_index = 0
    try:
        while True:
            payload = build_ws_payload(key, row_index)
            if payload:
                msg = payload.model_dump(mode="json")
                msg["type"] = "telemetry"
                await websocket.send_json(msg)
            row_index = (row_index + 1) % total_rows
            await asyncio.sleep(interval_sec)
    except WebSocketDisconnect:
        pass
    except Exception:
        try:
            await websocket.close()
        except Exception:
            pass


# Alias for main.py compatibility
async def bms_stream(*args, **kwargs):
    """Alias: same as websocket_bms_stream."""
    return await websocket_bms_stream(*args, **kwargs)
