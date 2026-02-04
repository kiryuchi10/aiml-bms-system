"""
Analytics: POST /{vehicle_id}/run, GET /{vehicle_id}/runs, /runs/{run_id}, /{vehicle_id}/cluster, /{vehicle_id}/explain.
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.sql import ModelRun, Vehicle

router = APIRouter()


class RunRequest(BaseModel):
    pipeline: str  # soc_validate | stress | cluster | risk
    params: dict = {}


class RunResponse(BaseModel):
    run_id: int
    status: str


@router.post("/{vehicle_id}/run", response_model=RunResponse)
def run_analytics(vehicle_id: int, body: RunRequest, db: Session = Depends(get_db)):
    v = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    run = ModelRun(vehicle_id=vehicle_id, pipeline=body.pipeline, params=body.params, result={}, status="completed")
    db.add(run)
    db.commit()
    db.refresh(run)
    return RunResponse(run_id=run.id, status=run.status)


class RunMeta(BaseModel):
    id: int
    pipeline: str
    status: str
    created_at: str


@router.get("/{vehicle_id}/runs", response_model=list[RunMeta])
def list_runs(vehicle_id: int, db: Session = Depends(get_db)):
    rows = db.query(ModelRun).filter(ModelRun.vehicle_id == vehicle_id).order_by(ModelRun.created_at.desc()).limit(50).all()
    return [RunMeta(id=r.id, pipeline=r.pipeline, status=r.status, created_at=r.created_at.isoformat()) for r in rows]


@router.get("/runs/{run_id}")
def get_run(run_id: int, db: Session = Depends(get_db)):
    r = db.query(ModelRun).filter(ModelRun.id == run_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Run not found")
    return {"id": r.id, "vehicle_id": r.vehicle_id, "pipeline": r.pipeline, "params": r.params, "result": r.result, "status": r.status}


@router.get("/{vehicle_id}/cluster")
def get_cluster(vehicle_id: int, db: Session = Depends(get_db)):
    return {"vehicle_id": vehicle_id, "embedding": [], "labels": []}


@router.get("/{vehicle_id}/explain")
def get_explain(vehicle_id: int, db: Session = Depends(get_db)):
    return {"vehicle_id": vehicle_id, "feature_importance": []}
