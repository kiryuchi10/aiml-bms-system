"""
ML API v1: train, runs, run/{id}, infer.
Wraps existing training routes with v1 prefix.
"""

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.feature_cell import FeatureCell
from app.models.ml_run_bms import BmsMlRun, BmsMlMetric
from app.models.training_run import TrainingRun
from app.ml.trainer import run_training, run_training_and_persist

router = APIRouter()


@router.get("/datasets")
def get_ml_datasets(db: Session = Depends(get_db)):
    """List ML-ready datasets from feature_cell (distinct vehicle_id + window_sec)."""
    rows = (
        db.query(FeatureCell.vehicle_id, FeatureCell.window_sec, func.count(FeatureCell.id).label("rows"))
        .group_by(FeatureCell.vehicle_id, FeatureCell.window_sec)
        .having(func.count(FeatureCell.id) > 0)
        .all()
    )
    if not rows:
        return {"datasets": []}
    return {
        "datasets": [
            {"vehicle_id": r.vehicle_id, "window_sec": r.window_sec, "row_count": r.rows}
            for r in rows
        ]
    }


class MLTrainBody(BaseModel):
    dataset_key: str = Field(..., description="Parquet dataset key")
    model_key: str = Field("mlp", description="mlp | conv1d")
    sequence_length: int = Field(1, ge=1, le=128)
    epochs: int = Field(5, ge=1, le=500)
    batch_size: int = Field(32, ge=1, le=1024)
    val_ratio: float = Field(0.2, ge=0.05, le=0.5)
    seed: int = 42


@router.post("/train")
def post_ml_train(
    body: MLTrainBody,
    background_tasks: BackgroundTasks,
    async_run: bool = False,
    db: Session = Depends(get_db),
):
    """
    Trigger PyTorch training. If async_run=true, enqueue in background and return run_id immediately.
    Otherwise run sync and return run_id + metrics.
    """
    if async_run:
        run = BmsMlRun(
            vehicle_id=1,
            run_name=f"{body.dataset_key}_{body.model_key}",
            dataset_name=body.dataset_key,
            model_name=body.model_key,
            status="queued",
            config_json=body.model_dump(),
        )
        db.add(run)
        db.commit()
        db.refresh(run)
        background_tasks.add_task(
            _run_training_background,
            run.id,
            body.dataset_key,
            body.model_key,
            body.sequence_length,
            body.epochs,
            body.batch_size,
            body.val_ratio,
            body.seed,
        )
        return {"run_id": run.id, "status": "queued", "message": "Training enqueued"}
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
            raise HTTPException(status_code=503, detail="PyTorch not installed") from e
        raise HTTPException(status_code=500, detail=str(e)) from e
    return {"run_id": run_id, "ok": result.get("ok", False), **{k: v for k, v in result.items() if k != "ok"}}


def _run_training_background(
    run_id: int,
    dataset_key: str,
    model_key: str,
    sequence_length: int,
    epochs: int,
    batch_size: int,
    val_ratio: float,
    seed: int,
) -> None:
    from app.db.session import SessionLocal
    from datetime import datetime, timezone
    db = SessionLocal()
    try:
        run = db.query(BmsMlRun).filter(BmsMlRun.id == run_id).first()
        if not run:
            return
        run.status = "running"
        db.commit()
        result = run_training(
            dataset_key=dataset_key,
            model_key=model_key,
            sequence_length=sequence_length,
            epochs=epochs,
            batch_size=batch_size,
            val_ratio=val_ratio,
            seed=seed,
        )
        run.status = "done" if result.get("ok") else "failed"
        run.finished_at = datetime.now(timezone.utc)
        if result.get("ok") and result.get("error_value") is not None:
            db.add(BmsMlMetric(ml_run_id=run_id, metric_name="val_mae", metric_value=result["error_value"]))
        db.commit()
    except Exception:
        run = db.query(BmsMlRun).filter(BmsMlRun.id == run_id).first()
        if run:
            run.status = "failed"
            run.finished_at = datetime.now(timezone.utc)
            db.commit()
    finally:
        db.close()


@router.get("/runs")
def get_ml_runs(
    db: Session = Depends(get_db),
    bms_only: bool = Query(False, description="If true, return only BMS ml_run table"),
):
    """List recent training runs (BMS ml_run or legacy training_runs)."""
    if bms_only:
        runs = db.query(BmsMlRun).order_by(BmsMlRun.created_at.desc()).limit(50).all()
        return [
            {
                "id": r.id,
                "vehicle_id": r.vehicle_id,
                "run_name": r.run_name,
                "dataset_name": r.dataset_name,
                "model_name": r.model_name,
                "status": r.status,
                "created_at": r.created_at.isoformat() if r.created_at else "",
                "finished_at": r.finished_at.isoformat() if r.finished_at else None,
            }
            for r in runs
        ]
    runs = db.query(TrainingRun).order_by(TrainingRun.created_at.desc()).limit(50).all()
    return [
        {"id": r.id, "status": r.status, "created_at": r.created_at.isoformat() if r.created_at else ""}
        for r in runs
    ]


@router.get("/runs/{run_id}")
def get_ml_run(run_id: int, db: Session = Depends(get_db)):
    """Get one run detail (BMS ml_run or legacy training_run)."""
    bms_run = db.query(BmsMlRun).filter(BmsMlRun.id == run_id).first()
    if bms_run:
        return {
            "id": bms_run.id,
            "vehicle_id": bms_run.vehicle_id,
            "run_name": bms_run.run_name,
            "dataset_name": bms_run.dataset_name,
            "model_name": bms_run.model_name,
            "status": bms_run.status,
            "config_json": bms_run.config_json,
            "artifact_uri": bms_run.artifact_uri,
            "created_at": bms_run.created_at.isoformat() if bms_run.created_at else "",
            "finished_at": bms_run.finished_at.isoformat() if bms_run.finished_at else None,
            "metrics": [
                {"metric_name": m.metric_name, "metric_value": m.metric_value}
                for m in (bms_run.metrics or [])
            ],
        }
    tr = db.query(TrainingRun).filter(TrainingRun.id == run_id).first()
    if not tr:
        raise HTTPException(status_code=404, detail="Run not found")
    return {
        "id": tr.id,
        "status": tr.status,
        "created_at": tr.created_at.isoformat() if tr.created_at else "",
        "results": [
            {
                "dataset_key": r.dataset_key,
                "model_key": r.model_key,
                "error_value": r.error_value,
                "error_mean": r.error_mean,
                "error_std": r.error_std,
                "is_overflow": r.is_overflow,
            }
            for r in tr.results
        ],
    }


class MLInferBody(BaseModel):
    run_id: int | None = None
    dataset_key: str = ""
    row_index: int = 0


@router.post("/infer")
def post_ml_infer(body: MLInferBody):
    """Placeholder: run inference for a run_id or dataset/row. Returns mock for now."""
    # TODO: load checkpoint for run_id, run model on dataset row, return prediction
    return {
        "ok": True,
        "run_id": body.run_id,
        "dataset_key": body.dataset_key,
        "row_index": body.row_index,
        "prediction": None,
        "message": "Inference endpoint placeholder; implement with saved model.",
    }
