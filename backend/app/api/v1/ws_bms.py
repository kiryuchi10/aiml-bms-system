"""
WebSocket /api/v1/ws/bms: stream BMS payload (timestamp, pack, cells, balancing, alarms).
Uses real parquet data via dashboard_service.
"""

import asyncio
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query

from app.services.parquet_bms_loader import get_first_available_dataset_key, load_parquet_frame
from app.services.dashboard_service import build_ws_payload

router = APIRouter()


@router.websocket("/ws/bms")
async def ws_bms_stream(
    websocket: WebSocket,
    dataset_key: str | None = Query(None),
    interval_ms: int = Query(1000, ge=200, le=60000),
) -> None:
    """
    Stream BMS payload: { timestamp, pack, cells, balancing, alarms } from parquet row-by-row.
    Connect: ws://host/api/v1/ws/bms?dataset_key=...&interval_ms=1000
    """
    await websocket.accept()
    key = dataset_key or get_first_available_dataset_key()
    if not key:
        await websocket.send_json({"error": "No parquet datasets in data directory"})
        await websocket.close()
        return
    frame = load_parquet_frame(key)
    if frame is None:
        await websocket.send_json({"error": f"Dataset not found: {key}"})
        await websocket.close()
        return
    df, _ = frame
    total_rows = len(df)
    if total_rows == 0:
        await websocket.send_json({"error": "Dataset is empty"})
        await websocket.close()
        return

    await websocket.send_json({
        "type": "connection",
        "status": "connected",
        "dataset_key": key,
        "total_rows": total_rows,
        "interval_ms": interval_ms,
    })

    interval_sec = interval_ms / 1000.0
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
