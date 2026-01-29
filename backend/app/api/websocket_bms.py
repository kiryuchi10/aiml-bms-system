"""WebSocket endpoint for BMS real-time streaming from parquet."""

import asyncio
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query

from app.services.parquet_bms_loader import (
    get_current_from_parquet,
    get_first_available_dataset_key,
    load_parquet_frame,
)

ws_router = APIRouter()


@ws_router.websocket("/ws/bms")
async def websocket_bms_stream(
    websocket: WebSocket,
    dataset_key: str | None = Query(None),
    interval_ms: int = Query(1000, ge=100, le=60000),
) -> None:
    """
    Stream BMS current snapshots from parquet row-by-row.
    Connect with: ws://host/ws/bms?dataset_key=...&interval_ms=1000
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
    df, col_map = frame
    total_rows = len(df)
    if total_rows == 0:
        await websocket.send_json({"error": "Dataset is empty"})
        await websocket.close()
        return

    # Send connection ack
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
            snapshot = get_current_from_parquet(key, row_index)
            if snapshot is None:
                break
            # Pydantic model to JSON-serializable dict
            payload = snapshot.model_dump(mode="json")
            payload["type"] = "data_update"
            await websocket.send_json(payload)
            row_index = (row_index + 1) % total_rows
            await asyncio.sleep(interval_sec)
    except WebSocketDisconnect:
        pass
    except Exception:
        try:
            await websocket.close()
        except Exception:
            pass
