"""
BMS Streamer: replay pack_timeseries in timestamp order over WebSocket.
Per-client streaming gate: only send to clients that sent {"type":"control","action":"start"}.
Applies passive balancing logic and derived alarms (open wire, OV/UV, pack OT).
"""
from __future__ import annotations

import asyncio
from datetime import datetime
from typing import Any, Dict

from fastapi import WebSocket

from app.services.bms_store import DataStore


# Passive balancing thresholds (realistic: ~10–20 mV start, 5–10 mV stop)
BALANCE_START_V = 0.015  # 15 mV
BALANCE_BAND_V = 0.010   # 10 mV
CELL_OV_V = 4.25
CELL_UV_V = 2.70
PACK_OT_C = 60.0


class Streamer:
    """Stream pack/cells/alarms from DB in timestamp order; apply balancing and alarms.
    Only sends to clients with streaming=True (client must send control start first).
    """

    def __init__(self, store: DataStore, default_vehicle_id: str = "MBM165-P50-B", rate_hz: float = 2.0) -> None:
        self.store = store
        self.default_vehicle_id = default_vehicle_id
        self.rate_hz = rate_hz
        self._manager = None
        self._task: asyncio.Task | None = None
        self._running = False
        self._client_streaming: Dict[WebSocket, bool] = {}

    def attach_manager(self, manager: Any) -> None:
        """Start broadcast loop when first client attaches."""
        self._manager = manager
        if self._task is None or self._task.done():
            self._running = True
            self._task = asyncio.create_task(self._run())

    def set_client_streaming(self, ws: WebSocket, streaming: bool) -> None:
        """Gate: only clients with streaming=True receive pack/cells/alarms."""
        self._client_streaming[ws] = streaming

    def remove_client(self, ws: WebSocket) -> None:
        """Remove client from streaming gate on disconnect."""
        self._client_streaming.pop(ws, None)

    async def _broadcast_if_streaming(self, payload: dict) -> None:
        """Send payload only to clients that have sent start (streaming=True)."""
        if not self._manager:
            return
        clients = await self._manager.get_clients()
        dead = []
        for ws in clients:
            if self._client_streaming.get(ws, False):
                try:
                    await self._manager.send_to(ws, payload)
                except Exception:
                    dead.append(ws)
        for ws in dead:
            self.remove_client(ws)
            await self._manager.disconnect(ws)

    async def _run(self) -> None:
        """Replay pack_timeseries by ts; for each ts broadcast pack, cells, alarms."""
        vehicle_id = self.default_vehicle_id
        while self._running:
            timestamps = self.store.get_pack_timestamps_asc(vehicle_id)
            if not timestamps:
                await asyncio.sleep(1.0)
                continue

            for ts in timestamps:
                if not self._running or self._manager is None:
                    await asyncio.sleep(0.5)
                    continue

                pack = self.store.get_pack_at(vehicle_id, ts)
                if not pack:
                    continue

                cells, _ = self.store.get_latest_cells(vehicle_id, ts=ts)
                cells = self._apply_passive_balancing(pack, cells)
                alarms = self._derive_alarms(pack, cells)

                ts_iso = ts.isoformat() if isinstance(ts, datetime) else str(ts)

                await self._broadcast_if_streaming({
                    "scope": "pack",
                    "pack_voltage": pack.get("pack_voltage"),
                    "pack_current": pack.get("pack_current"),
                    "soc": pack.get("soc"),
                    "soh": pack.get("soh"),
                    "pack_temp": pack.get("pack_temp"),
                    "ambient_temp": pack.get("ambient_temp"),
                    "mode": pack.get("mode") or "Idle",
                    "ts": ts_iso,
                })

                await self._broadcast_if_streaming({
                    "scope": "cells",
                    "cells": [
                        {
                            "id": c.get("id"),
                            "v": c.get("v"),
                            "t": c.get("t"),
                            "bal": bool(c.get("bal")),
                            "alarm": bool(c.get("alarm")),
                        }
                        for c in cells
                    ],
                })

                await self._broadcast_if_streaming({
                    "scope": "alarms",
                    "active": alarms["active"],
                    "latched": alarms["latched"],
                })

                await asyncio.sleep(1.0 / self.rate_hz)

            await asyncio.sleep(0.2)

    @staticmethod
    def _apply_passive_balancing(pack: dict[str, Any], cells: list[dict[str, Any]]) -> list[dict[str, Any]]:
        """Set bal=True for cells above (min + band) when charging and deltaV >= start threshold."""
        mode = (pack.get("mode") or "").lower()
        vs = [c["v"] for c in cells if c.get("v") is not None]
        if not vs:
            return cells

        min_v = min(vs)
        max_v = max(vs)
        delta_v = max_v - min_v

        balancing_allowed = "charge" in mode or "charging" in mode
        for c in cells:
            c["bal"] = False

        if balancing_allowed and delta_v >= BALANCE_START_V:
            for c in cells:
                if c.get("v") is None:
                    continue
                if c["v"] >= (min_v + BALANCE_BAND_V):
                    c["bal"] = True

        return cells

    @staticmethod
    def _derive_alarms(pack: dict[str, Any], cells: list[dict[str, Any]]) -> dict[str, list[str]]:
        """Derive active/latched alarms: open wire, cell OV/UV, pack OT."""
        active: list[str] = []
        latched: list[str] = []

        missing = [c for c in cells if c.get("v") is None]
        if missing:
            active.append("Open Wire")

        for c in cells:
            v = c.get("v")
            if v is not None:
                if v > CELL_OV_V:
                    active.append("Cell OV")
                    latched.append("Cell OV")
                if v < CELL_UV_V:
                    active.append("Cell UV")
                    latched.append("Cell UV")
            c["alarm"] = False
            if v is not None and (v > CELL_OV_V or v < CELL_UV_V):
                c["alarm"] = True

        pack_temp = pack.get("pack_temp")
        if pack_temp is not None and pack_temp > PACK_OT_C:
            active.append("Pack OT")

        return {"active": list(dict.fromkeys(active)), "latched": list(dict.fromkeys(latched))}
