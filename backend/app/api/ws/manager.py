"""
WebSocket manager: accept connections, broadcast JSON to all BMS clients.
Supports get_clients() and send_to(ws, payload) for per-client streaming gate.
"""
import asyncio
from typing import List, Set

from fastapi import WebSocket


class WSManager:
    """Thread-safe set of WebSocket connections; broadcast to all or send to one."""

    def __init__(self) -> None:
        self._clients: Set[WebSocket] = set()
        self._lock = asyncio.Lock()

    async def connect(self, ws: WebSocket) -> None:
        await ws.accept()
        async with self._lock:
            self._clients.add(ws)

    async def disconnect(self, ws: WebSocket) -> None:
        async with self._lock:
            self._clients.discard(ws)

    async def get_clients(self) -> List[WebSocket]:
        """Return a copy of connected clients (for streamer to filter by streaming gate)."""
        async with self._lock:
            return list(self._clients)

    async def send_to(self, ws: WebSocket, payload: dict) -> None:
        """Send JSON to a single client; does not remove on failure (caller may remove)."""
        try:
            await ws.send_json(payload)
        except Exception:
            pass

    async def broadcast_json(self, payload: dict) -> None:
        async with self._lock:
            clients = list(self._clients)
        dead = []
        for ws in clients:
            try:
                await ws.send_json(payload)
            except Exception:
                dead.append(ws)
        for ws in dead:
            await self.disconnect(ws)

    @property
    def count(self) -> int:
        return len(self._clients)
