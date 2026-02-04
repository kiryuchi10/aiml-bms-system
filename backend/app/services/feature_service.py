"""
Feature compute: trip-level and rolling features.
"""
from app.core.logging import get_logger

logger = get_logger(__name__)


def compute_trip_features(vehicle_id: int, trip_id: int | None = None) -> dict:
    """Placeholder: compute trip features from telemetry."""
    return {}


def compute_rolling(vehicle_id: int, window: str = "7d") -> list[dict]:
    """Placeholder: rolling window features."""
    return []
