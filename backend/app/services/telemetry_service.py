"""
Telemetry: query + downsample for timeseries.
"""
from app.core.logging import get_logger
from app.db.session import SessionLocal
from app.models.sql import TelemetryRaw

logger = get_logger(__name__)


def get_timeseries(vehicle_id: int, signal: str, t0: str | None = None, t1: str | None = None, ds: str | None = None):
    """Query telemetry_raw and optionally downsample."""
    db = SessionLocal()
    try:
        q = db.query(TelemetryRaw).filter(TelemetryRaw.vehicle_id == vehicle_id, TelemetryRaw.signal == signal)
        if t0:
            q = q.filter(TelemetryRaw.ts >= t0)
        if t1:
            q = q.filter(TelemetryRaw.ts <= t1)
        rows = q.order_by(TelemetryRaw.ts).limit(10000).all()
        return [{"ts": r.ts.isoformat(), "value": r.value} for r in rows]
    finally:
        db.close()
