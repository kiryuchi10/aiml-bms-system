"""BMS telemetry models: pack, module, cell (append-only time-series)."""

from datetime import datetime
from sqlalchemy import BigInteger, Boolean, DateTime, Float, ForeignKey, Integer, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class TelemetryPack(Base):
    __tablename__ = "telemetry_pack"

    id: Mapped[int] = mapped_column(BigInteger(), primary_key=True, autoincrement=True)
    vehicle_id: Mapped[int | None] = mapped_column(BigInteger(), ForeignKey("vehicle.id"), nullable=True)
    ts: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    pack_voltage: Mapped[float | None] = mapped_column(Float(), nullable=True)
    pack_current: Mapped[float | None] = mapped_column(Float(), nullable=True)
    pack_power: Mapped[float | None] = mapped_column(Float(), nullable=True)
    soc: Mapped[float | None] = mapped_column(Float(), nullable=True)
    soh: Mapped[float | None] = mapped_column(Float(), nullable=True)
    pack_temp: Mapped[float | None] = mapped_column(Float(), nullable=True)
    source: Mapped[str | None] = mapped_column(Text(), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class TelemetryModule(Base):
    __tablename__ = "telemetry_module"

    id: Mapped[int] = mapped_column(BigInteger(), primary_key=True, autoincrement=True)
    vehicle_id: Mapped[int | None] = mapped_column(BigInteger(), ForeignKey("vehicle.id"), nullable=True)
    module_id: Mapped[int] = mapped_column(Integer(), nullable=False)
    ts: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    module_voltage: Mapped[float | None] = mapped_column(Float(), nullable=True)
    module_current: Mapped[float | None] = mapped_column(Float(), nullable=True)
    module_temp: Mapped[float | None] = mapped_column(Float(), nullable=True)
    v_min: Mapped[float | None] = mapped_column(Float(), nullable=True)
    v_max: Mapped[float | None] = mapped_column(Float(), nullable=True)
    t_min: Mapped[float | None] = mapped_column(Float(), nullable=True)
    t_max: Mapped[float | None] = mapped_column(Float(), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class TelemetryCell(Base):
    __tablename__ = "telemetry_cell"

    id: Mapped[int] = mapped_column(BigInteger(), primary_key=True, autoincrement=True)
    vehicle_id: Mapped[int | None] = mapped_column(BigInteger(), ForeignKey("vehicle.id"), nullable=True)
    module_id: Mapped[int | None] = mapped_column(Integer(), nullable=True)
    cell_id: Mapped[int] = mapped_column(Integer(), nullable=False)
    ts: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    voltage: Mapped[float | None] = mapped_column(Float(), nullable=True)
    current: Mapped[float | None] = mapped_column(Float(), nullable=True)
    temperature: Mapped[float | None] = mapped_column(Float(), nullable=True)
    soc: Mapped[float | None] = mapped_column(Float(), nullable=True)
    balancing: Mapped[bool] = mapped_column(Boolean(), nullable=False, default=False)
    source: Mapped[str | None] = mapped_column(Text(), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
