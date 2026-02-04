"""
Parse ID1.parquet, CUP1.parquet and load into staging/telemetry.
"""
from app.core.logging import get_logger

logger = get_logger(__name__)


def load_parquet(path: str) -> int:
    """Placeholder: load parquet and return row count."""
    logger.info("load_parquet %s", path)
    return 0
