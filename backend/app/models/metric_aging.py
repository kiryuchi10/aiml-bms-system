"""Metric aging (health summaries)."""

from datetime import datetime
from sqlalchemy import BigInteger, Float, ForeignKey, Integer, DateTime
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class MetricAging(Base):
    __tablename__ = "metric_aging"

    id: Mapped[int] = mapped_column(BigInteger(), primary_key=True, autoincrement=True)
    vehicle_id: Mapped[int | None] = mapped_column(BigInteger(), ForeignKey("vehicle.id"), nullable=True)
    module_id: Mapped[int | None] = mapped_column(Integer(), nullable=True)
    cell_id: Mapped[int | None] = mapped_column(Integer(), nullable=True)
    ts: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    aging_index: Mapped[float | None] = mapped_column(Float(), nullable=True)
    resistance_proxy: Mapped[float | None] = mapped_column(Float(), nullable=True)
    capacity_proxy: Mapped[float | None] = mapped_column(Float(), nullable=True)
    soh_proxy: Mapped[float | None] = mapped_column(Float(), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
