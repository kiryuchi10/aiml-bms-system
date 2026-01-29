"""
Create all database tables from SQLAlchemy models.
Run from backend/:  python -m app.db.create_tables
"""
from app.db.base import Base
from app.db.session import engine

# Import models so they are registered with Base.metadata
from app.models import (  # noqa: F401
    Dataset,
    MLModel,
    TrainingRun,
    TrainingResult,
    WLTPReference,
)

if __name__ == "__main__":
    Base.metadata.create_all(bind=engine)
    print("Tables created: datasets, ml_models, training_runs, training_results, wltp_reference")
