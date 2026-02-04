"""Build trip/rolling features."""
from app.core.logging import get_logger
logger = get_logger(__name__)


def build_features(vehicle_id: int, window: str = "7d") -> int:
    return 0
