"""
Ingest: parse parquet/json -> staging (telemetry_raw, trips, charging).
Do not commit raw data paths or secrets.
"""
from app.core.logging import get_logger

logger = get_logger(__name__)


def ingest_parquet(path: str) -> int:
    """Placeholder: load parquet and insert into telemetry_raw/trips."""
    logger.info("ingest_parquet %s", path)
    return 0


def ingest_json(path: str) -> int:
    """Placeholder: load track_*.json / charging_*.json and insert."""
    logger.info("ingest_json %s", path)
    return 0
