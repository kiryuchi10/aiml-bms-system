"""
WebSocket /ws/bms/db: stream telemetry_cell from DB (replay loop).
Replay from DB as "live" for dashboard.
"""

import asyncio
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query

from app.db.session import SessionLocal
from app.models.telemetry_bms import TelemetryCell

router = APIRouter()


def _fetch_batch(vehicle_id: int, last_id: int | None, limit: int = 50) -> list[dict]:
    """Sync: fetch next batch of telemetry_cell rows (for replay)."""
    db = SessionLocal()
    try:
        q = (
            db.query(TelemetryCell)
            .filter(TelemetryCell.vehicle_id == vehicle_id)
            .order_by(TelemetryCell.id.asc())
        )
        if last_id is not None:
            q = q.filter(TelemetryCell.id > last_id)
        rows = q.limit(limit).all()
        return [
            {
                "id": r.id,
                "vehicle_id": r.vehicle_id,
                "cell_id": r.cell_id,
                "ts": r.ts.isoformat() if r.ts else None,
                "voltage": r.voltage,
                "current": r.current,
                "temperature": r.temperature,
                "soc": r.soc,
                "balancing": r.balancing,
            }
            for r in rows
        ]
    finally:
        db.close()


@router.websocket("/ws/bms/db")
async def ws_bms_db_replay(
    websocket: WebSocket,
    vehicle_id: int = Query(1, ge=1),
    interval_ms: int = Query(500, ge=100, le=10000),
    limit: int = Query(50, ge=1, le=500),
) -> None:
    """
    Stream telemetry_cell from DB by id order (replay loop).
    Connect: ws://host/ws/bms/db?vehicle_id=1&interval_ms=500
    """
    await websocket.accept()
    await websocket.send_json({
        "type": "connection",
        "status": "connected",
        "source": "db",
        "vehicle_id": vehicle_id,
        "interval_ms": interval_ms,
    })
    interval_sec = interval_ms / 1000.0
    last_id: int | None = None
    loop = asyncio.get_event_loop()
    try:
        while True:
            batch = await loop.run_in_executor(
                None,
                lambda: _fetch_batch(vehicle_id, last_id, limit),
            )
            if not batch:
                last_id = None
                await asyncio.sleep(interval_sec)
                continue
            for row in batch:
                row["type"] = "telemetry"
                await websocket.send_json(row)
                last_id = row["id"]
            await asyncio.sleep(interval_sec)
    except WebSocketDisconnect:
        pass
    except Exception:
        try:
            await websocket.close()
        except Exception:
            pass
