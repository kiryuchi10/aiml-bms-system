"""Feature cell (engineered features)."""

from datetime import datetime
from sqlalchemy import BigInteger, Float, ForeignKey, Integer, String, DateTime
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class FeatureCell(Base):
    __tablename__ = "feature_cell"

    id: Mapped[int] = mapped_column(BigInteger(), primary_key=True, autoincrement=True)
    vehicle_id: Mapped[int | None] = mapped_column(BigInteger(), ForeignKey("vehicle.id"), nullable=True)
    module_id: Mapped[int | None] = mapped_column(Integer(), nullable=True)
    cell_id: Mapped[int] = mapped_column(Integer(), nullable=False)
    ts_window_end: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    window_sec: Mapped[int] = mapped_column(Integer(), nullable=False)
    v_mean: Mapped[float | None] = mapped_column(Float(), nullable=True)
    v_std: Mapped[float | None] = mapped_column(Float(), nullable=True)
    t_mean: Mapped[float | None] = mapped_column(Float(), nullable=True)
    t_std: Mapped[float | None] = mapped_column(Float(), nullable=True)
    dv_dt: Mapped[float | None] = mapped_column(Float(), nullable=True)
    dt_dt: Mapped[float | None] = mapped_column(Float(), nullable=True)
    i_mean: Mapped[float | None] = mapped_column(Float(), nullable=True)
    i_std: Mapped[float | None] = mapped_column(Float(), nullable=True)
    z_norm_version: Mapped[str | None] = mapped_column(String(128), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
