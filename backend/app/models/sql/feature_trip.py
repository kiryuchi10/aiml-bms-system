from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import JSONB

from app.db.base import Base


class FeatureTrip(Base):
    __tablename__ = "feature_trip"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    vehicle_id: Mapped[int] = mapped_column(ForeignKey("vehicles.id", ondelete="CASCADE"), nullable=False)
    trip_id: Mapped[int | None] = mapped_column(ForeignKey("trips.id", ondelete="SET NULL"), nullable=True)
    feature_set: Mapped[str] = mapped_column(String(64), nullable=False)
    features: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    computed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
