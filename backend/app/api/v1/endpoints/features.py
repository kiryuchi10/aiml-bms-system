"""
Features: GET /{vehicle_id}/trip-features, /{vehicle_id}/rolling.
"""
from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.sql import FeatureTrip

router = APIRouter()


class TripFeatures(BaseModel):
    trip_id: int | None
    feature_set: str
    features: dict


@router.get("/{vehicle_id}/trip-features", response_model=list[TripFeatures])
def get_trip_features(
    vehicle_id: int,
    trip_id: int | None = Query(None),
    db: Session = Depends(get_db),
):
    q = db.query(FeatureTrip).filter(FeatureTrip.vehicle_id == vehicle_id)
    if trip_id is not None:
        q = q.filter(FeatureTrip.trip_id == trip_id)
    rows = q.all()
    return [TripFeatures(trip_id=r.trip_id, feature_set=r.feature_set, features=r.features or {}) for r in rows]


@router.get("/{vehicle_id}/rolling", response_model=list[TripFeatures])
def get_rolling(
    vehicle_id: int,
    window: str = Query("7d"),
    db: Session = Depends(get_db),
):
    q = db.query(FeatureTrip).filter(FeatureTrip.vehicle_id == vehicle_id).order_by(FeatureTrip.computed_at.desc()).limit(100)
    rows = q.all()
    return [TripFeatures(trip_id=r.trip_id, feature_set=r.feature_set, features=r.features or {}) for r in rows]
