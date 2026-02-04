from app.db.base import Base

from app.models.sql.user import User
from app.models.sql.vehicle import Vehicle
from app.models.sql.trip import Trip
from app.models.sql.charging import ChargingSession
from app.models.sql.telemetry_raw import TelemetryRaw
from app.models.sql.feature_trip import FeatureTrip
from app.models.sql.metric_aging import MetricAging
from app.models.sql.model_run import ModelRun
from app.models.sql.alert import Alert

__all__ = [
    "Base",
    "User",
    "Vehicle",
    "Trip",
    "ChargingSession",
    "TelemetryRaw",
    "FeatureTrip",
    "MetricAging",
    "ModelRun",
    "Alert",
]
