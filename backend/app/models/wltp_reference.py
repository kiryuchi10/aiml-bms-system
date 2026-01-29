from sqlalchemy import Double
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class WLTPReference(Base):
    __tablename__ = "wltp_reference"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    elapsed_s: Mapped[float] = mapped_column(Double(), nullable=False)
    wltp_kmh: Mapped[float] = mapped_column(Double(), nullable=False)
    wltp_current_a: Mapped[float] = mapped_column(Double(), nullable=False)
    current_adapted_a: Mapped[float] = mapped_column(Double(), nullable=False)
