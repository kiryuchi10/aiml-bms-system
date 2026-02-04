"""
WebSocket: /api/v1/ws/bms — push {vehicle_id, signal, value, ts}.
Use for live BMS data; token via query param optional.
"""
import asyncio
import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

ws_router = APIRouter()
_connections: list[WebSocket] = []


@ws_router.websocket("/ws/bms")
async def bms_ws(websocket: WebSocket) -> None:
    await websocket.accept()
    _connections.append(websocket)
    try:
        await websocket.send_json({"type": "connection", "status": "connected"})
        while True:
            raw = await websocket.receive_text()
            try:
                msg = json.loads(raw)
                # Echo or broadcast; in production push from ingest/telemetry
                if msg.get("type") == "ping":
                    await websocket.send_json({"type": "pong"})
            except json.JSONDecodeError:
                pass
    except WebSocketDisconnect:
        pass
    finally:
        if websocket in _connections:
            _connections.remove(websocket)


async def broadcast_bms(vehicle_id: int, signal: str, value: float, ts: str) -> None:
    payload = {"vehicle_id": vehicle_id, "signal": signal, "value": value, "ts": ts}
    for ws in _connections:
        try:
            await ws.send_json(payload)
        except Exception:
            pass
