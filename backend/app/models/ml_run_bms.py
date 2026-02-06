"""ML run and metric for BMS (ml_run, ml_metric tables)."""

from datetime import datetime
from sqlalchemy import BigInteger, DateTime, Float, ForeignKey, String, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class BmsMlRun(Base):
    __tablename__ = "ml_run"

    id: Mapped[int] = mapped_column(BigInteger(), primary_key=True, autoincrement=True)
    vehicle_id: Mapped[int | None] = mapped_column(BigInteger(), ForeignKey("vehicle.id"), nullable=True)
    run_name: Mapped[str | None] = mapped_column(String(128), nullable=True)
    dataset_name: Mapped[str] = mapped_column(String(128), nullable=False)
    model_name: Mapped[str] = mapped_column(String(64), nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False)
    config_json: Mapped[dict | None] = mapped_column(JSON(), nullable=True)
    artifact_uri: Mapped[str | None] = mapped_column(Text(), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    metrics: Mapped[list["BmsMlMetric"]] = relationship(back_populates="run", cascade="all, delete-orphan")


class BmsMlMetric(Base):
    __tablename__ = "ml_metric"

    id: Mapped[int] = mapped_column(BigInteger(), primary_key=True, autoincrement=True)
    ml_run_id: Mapped[int] = mapped_column(BigInteger(), ForeignKey("ml_run.id", ondelete="CASCADE"), nullable=False)
    metric_name: Mapped[str] = mapped_column(String(64), nullable=False)
    metric_value: Mapped[float | None] = mapped_column(Float(), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    run: Mapped["BmsMlRun"] = relationship(back_populates="metrics")
