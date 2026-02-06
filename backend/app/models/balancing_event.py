"""Balancing event."""

from datetime import datetime
from sqlalchemy import BigInteger, Boolean, DateTime, ForeignKey, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class BalancingEvent(Base):
    __tablename__ = "balancing_event"

    id: Mapped[int] = mapped_column(BigInteger(), primary_key=True, autoincrement=True)
    vehicle_id: Mapped[int | None] = mapped_column(BigInteger(), ForeignKey("vehicle.id"), nullable=True)
    module_id: Mapped[int | None] = mapped_column(Integer(), nullable=True)
    cell_id: Mapped[int] = mapped_column(Integer(), nullable=False)
    ts: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    mode: Mapped[str | None] = mapped_column(Text(), nullable=True)
    reason: Mapped[str | None] = mapped_column(Text(), nullable=True)
    onoff: Mapped[bool] = mapped_column(Boolean(), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
