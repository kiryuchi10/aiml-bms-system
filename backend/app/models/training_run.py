from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class TrainingRun(Base):
    __tablename__ = "training_runs"

    id: Mapped[int] = mapped_column(primary_key=True)
    status: Mapped[str] = mapped_column(String(32), default="completed")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    results: Mapped[list["TrainingResult"]] = relationship(
        back_populates="run",
        cascade="all, delete-orphan",
    )


class TrainingResult(Base):
    __tablename__ = "training_results"

    id: Mapped[int] = mapped_column(primary_key=True)
    run_id: Mapped[int] = mapped_column(ForeignKey("training_runs.id", ondelete="CASCADE"))
    dataset_key: Mapped[str] = mapped_column(String(32), index=True)
    model_key: Mapped[str] = mapped_column(String(64), index=True)

    # If seed-sensitive: store mean/std (computed from per-seed errors).
    # Otherwise: store value only.
    error_value: Mapped[float | None] = mapped_column(default=None)
    error_mean: Mapped[float | None] = mapped_column(default=None)
    error_std: Mapped[float | None] = mapped_column(default=None)

    # Flag for thresholded / capped values like >1000
    is_overflow: Mapped[bool] = mapped_column(default=False)
    overflow_threshold: Mapped[float | None] = mapped_column(default=1000.0)

    run: Mapped["TrainingRun"] = relationship(back_populates="results")

