"""
WebSocket: /api/v1/ws/bms — BMS real-time stream (pack/cells/alarms).
Control gate: client sends {"type":"control","action":"start"|"stop"} to enable/disable streaming.
Default streaming=False until client sends start.
"""
import json
from fastapi import APIRouter, Request, WebSocket, WebSocketDisconnect

ws_router = APIRouter()


@ws_router.websocket("/ws/bms")
async def bms_ws(websocket: WebSocket, request: Request) -> None:
    manager = request.app.state.ws_manager
    streamer = request.app.state.bms_streamer

    await manager.connect(websocket)  # accepts and adds to clients
    streamer.attach_manager(manager)

    # Default: no streaming until client sends start
    streamer.set_client_streaming(websocket, False)
    await websocket.send_json({"scope": "state", "streaming": False})

    try:
        while True:
            raw = await websocket.receive_text()
            try:
                msg = json.loads(raw)
                if msg.get("type") == "control":
                    action = msg.get("action")
                    if action == "start":
                        streamer.set_client_streaming(websocket, True)
                        await websocket.send_json({"scope": "state", "streaming": True})
                    elif action == "stop":
                        streamer.set_client_streaming(websocket, False)
                        await websocket.send_json({"scope": "state", "streaming": False})
                elif msg.get("type") == "ping":
                    await websocket.send_json({"type": "pong"})
            except json.JSONDecodeError:
                pass
    except WebSocketDisconnect:
        pass
    finally:
        streamer.remove_client(websocket)
        await manager.disconnect(websocket)
