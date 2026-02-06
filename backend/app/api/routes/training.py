"""Trigger PyTorch training and list training runs."""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.training_run import TrainingRun, TrainingResult
from app.ml.trainer import run_training, run_training_and_persist

router = APIRouter()


class TrainingRunRequest(BaseModel):
    dataset_key: str = Field(..., description="Parquet dataset key (filename stem)")
    model_key: str = Field("mlp", description="Model: mlp or conv1d")
    sequence_length: int = Field(1, ge=1, le=128)
    epochs: int = Field(5, ge=1, le=500)
    batch_size: int = Field(32, ge=1, le=1024)
    val_ratio: float = Field(0.2, ge=0.05, le=0.5)
    seed: int = Field(42)


class TrainingRunResponse(BaseModel):
    run_id: int | None
    ok: bool
    dataset_key: str
    model_key: str
    error_value: float | None = None
    val_mse: float | None = None
    val_mae: float | None = None
    n_train: int | None = None
    n_val: int | None = None
    error: str | None = None


class TrainingRunListItem(BaseModel):
    id: int
    status: str
    created_at: str


class TrainingRunDetailResponse(BaseModel):
    id: int
    status: str
    created_at: str
    results: list[dict]


@router.post("/run", response_model=TrainingRunResponse)
def post_training_run(
    body: TrainingRunRequest,
    db: Session = Depends(get_db),
) -> TrainingRunResponse:
    """
    Run PyTorch training on the given dataset with the given model.
    Persists a TrainingRun and one TrainingResult to the DB.
    """
    try:
        run_id, result = run_training_and_persist(
            dataset_key=body.dataset_key,
            model_key=body.model_key,
            db_session=db,
            sequence_length=body.sequence_length,
            epochs=body.epochs,
            batch_size=body.batch_size,
            val_ratio=body.val_ratio,
            seed=body.seed,
        )
    except RuntimeError as e:
        if "PyTorch" in str(e):
            raise HTTPException(
                status_code=503,
                detail="PyTorch is not installed. Add 'torch' to requirements.txt and install.",
            ) from e
        raise HTTPException(status_code=500, detail=str(e)) from e

    if not result.get("ok"):
        return TrainingRunResponse(
            run_id=None,
            ok=False,
            dataset_key=body.dataset_key,
            model_key=body.model_key,
            error=result.get("error", "unknown"),
        )

    return TrainingRunResponse(
        run_id=run_id,
        ok=True,
        dataset_key=result["dataset_key"],
        model_key=result["model_key"],
        error_value=result.get("error_value"),
        val_mse=result.get("val_mse"),
        val_mae=result.get("val_mae"),
        n_train=result.get("n_train"),
        n_val=result.get("n_val"),
    )


@router.get("/runs", response_model=list[TrainingRunListItem])
def list_training_runs(db: Session = Depends(get_db)) -> list[TrainingRunListItem]:
    """List recent training runs (id, status, created_at)."""
    runs = db.query(TrainingRun).order_by(TrainingRun.created_at.desc()).limit(50).all()
    return [
        TrainingRunListItem(
            id=r.id,
            status=r.status,
            created_at=r.created_at.isoformat() if r.created_at else "",
        )
        for r in runs
    ]


@router.get("/runs/{run_id}", response_model=TrainingRunDetailResponse)
def get_training_run(run_id: int, db: Session = Depends(get_db)) -> TrainingRunDetailResponse:
    """Get one training run with its results."""
    run = db.query(TrainingRun).filter(TrainingRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Training run not found")
    results = [
        {
            "dataset_key": r.dataset_key,
            "model_key": r.model_key,
            "error_value": r.error_value,
            "error_mean": r.error_mean,
            "error_std": r.error_std,
            "is_overflow": r.is_overflow,
        }
        for r in run.results
    ]
    return TrainingRunDetailResponse(
        id=run.id,
        status=run.status,
        created_at=run.created_at.isoformat() if run.created_at else "",
        results=results,
    )
