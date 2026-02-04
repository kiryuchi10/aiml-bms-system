"""
Alert service: create/acknowledge alerts.
"""
from app.core.logging import get_logger
from app.db.session import get_db
from app.models.sql import Alert

logger = get_logger(__name__)


def create_alert(vehicle_id: int, severity: str, message: str, db=None) -> Alert | None:
    """Create an alert. db optional for reuse."""
    if db is None:
        from app.db.session import SessionLocal
        db = SessionLocal()
        try:
            a = Alert(vehicle_id=vehicle_id, severity=severity, message=message)
            db.add(a)
            db.commit()
            db.refresh(a)
            return a
        finally:
            db.close()
    a = Alert(vehicle_id=vehicle_id, severity=severity, message=message)
    db.add(a)
    return a
