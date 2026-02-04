"""
BMS DataStore: read pack_timeseries, cell_timeseries, bms_alarms, feature tables.
Used by dashboard REST and WebSocket streamer. Safety-critical path kept separate.
"""
from __future__ import annotations

from datetime import datetime
from typing import Any

from sqlalchemy import text
from sqlalchemy.engine import Engine


class DataStore:
    """Read-only store for BMS timeseries and alarms (real parquet-derived data)."""

    def __init__(self, engine: Engine) -> None:
        self.engine = engine

    def get_latest_pack(self, vehicle_id: str) -> dict[str, Any] | None:
        """Latest pack row for vehicle."""
        q = text("""
            SELECT ts, pack_voltage, pack_current, pack_temp, ambient_temp, soc, soh, mode
            FROM pack_timeseries
            WHERE vehicle_id = :vid
            ORDER BY ts DESC
            LIMIT 1
        """)
        with self.engine.connect() as conn:
            row = conn.execute(q, {"vid": vehicle_id}).mappings().first()
        return dict(row) if row else None

    def get_pack_at(self, vehicle_id: str, ts: datetime) -> dict[str, Any] | None:
        """Pack row at exact timestamp."""
        q = text("""
            SELECT ts, pack_voltage, pack_current, pack_temp, ambient_temp, soc, soh, mode
            FROM pack_timeseries
            WHERE vehicle_id = :vid AND ts = :ts
            LIMIT 1
        """)
        with self.engine.connect() as conn:
            row = conn.execute(q, {"vid": vehicle_id, "ts": ts}).mappings().first()
        return dict(row) if row else None

    def get_latest_cells(self, vehicle_id: str, ts: datetime | None = None) -> tuple[list[dict[str, Any]], datetime | None]:
        """Cells at latest or given timestamp. Returns (list of cell dicts, ts)."""
        if ts is None:
            q_ts = text("""
                SELECT ts FROM cell_timeseries
                WHERE vehicle_id = :vid
                ORDER BY ts DESC
                LIMIT 1
            """)
            with self.engine.connect() as conn:
                ts = conn.execute(q_ts, {"vid": vehicle_id}).scalar()
        if ts is None:
            return [], None

        q = text("""
            SELECT cell_id AS id, voltage AS v, temperature AS t, current AS i,
                   abs_soc, soh, balancing AS bal, alarm
            FROM cell_timeseries
            WHERE vehicle_id = :vid AND ts = :ts
            ORDER BY cell_id ASC
        """)
        with self.engine.connect() as conn:
            rows = conn.execute(q, {"vid": vehicle_id, "ts": ts}).mappings().all()
        return [dict(r) for r in rows], ts

    def get_pack_timestamps_asc(self, vehicle_id: str) -> list[datetime]:
        """All pack timestamps in ascending order (for streamer replay)."""
        q = text("""
            SELECT ts FROM pack_timeseries
            WHERE vehicle_id = :vid
            ORDER BY ts ASC
        """)
        with self.engine.connect() as conn:
            return [r[0] for r in conn.execute(q, {"vid": vehicle_id}).all()]

    def get_alarms(self, vehicle_id: str) -> dict[str, list[str]]:
        """Active and latched alarm names."""
        q_active = text("""
            SELECT name FROM bms_alarms
            WHERE vehicle_id = :vid AND is_active = TRUE
            ORDER BY last_seen DESC
        """)
        q_latched = text("""
            SELECT name FROM bms_alarms
            WHERE vehicle_id = :vid AND is_latched = TRUE
            ORDER BY last_seen DESC
        """)
        with self.engine.connect() as conn:
            active = [r[0] for r in conn.execute(q_active, {"vid": vehicle_id}).all()]
            latched = [r[0] for r in conn.execute(q_latched, {"vid": vehicle_id}).all()]
        return {"active": active, "latched": latched}

    def get_learnings(self, vehicle_id: str) -> dict[str, Any]:
        """Latest thermal (or other) features as learnings."""
        q = text("""
            SELECT feature
            FROM thermal_features
            WHERE vehicle_id = :vid
            ORDER BY ts DESC NULLS LAST
            LIMIT 1
        """)
        with self.engine.connect() as conn:
            row = conn.execute(q, {"vid": vehicle_id}).mappings().first()
        if not row or not row["feature"]:
            return {}
        f = row["feature"]
        return f if isinstance(f, dict) else {}
