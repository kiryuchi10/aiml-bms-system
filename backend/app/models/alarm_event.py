"""Alarm event (rule engine / ML)."""

from datetime import datetime
from sqlalchemy import BigInteger, Float, ForeignKey, Integer, String, DateTime, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class AlarmEvent(Base):
    __tablename__ = "alarm_event"

    id: Mapped[int] = mapped_column(BigInteger(), primary_key=True, autoincrement=True)
    vehicle_id: Mapped[int | None] = mapped_column(BigInteger(), ForeignKey("vehicle.id"), nullable=True)
    module_id: Mapped[int | None] = mapped_column(Integer(), nullable=True)
    cell_id: Mapped[int | None] = mapped_column(Integer(), nullable=True)
    ts: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    severity: Mapped[str] = mapped_column(String(16), nullable=False)
    alarm_type: Mapped[str] = mapped_column(String(64), nullable=False)
    value: Mapped[float | None] = mapped_column(Float(), nullable=True)
    threshold: Mapped[float | None] = mapped_column(Float(), nullable=True)
    rationale: Mapped[str | None] = mapped_column(Text(), nullable=True)
    source: Mapped[str | None] = mapped_column(String(32), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
