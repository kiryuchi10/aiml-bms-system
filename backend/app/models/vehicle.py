"""Vehicle model for BMS (vehicle table)."""

from datetime import datetime
from sqlalchemy import BigInteger, DateTime, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Vehicle(Base):
    __tablename__ = "vehicle"

    id: Mapped[int] = mapped_column(BigInteger(), primary_key=True, autoincrement=True)
    vin: Mapped[str | None] = mapped_column(String(64), unique=True, nullable=True)
    name: Mapped[str | None] = mapped_column(Text(), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
