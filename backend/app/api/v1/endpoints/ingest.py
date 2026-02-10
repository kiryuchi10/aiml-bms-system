"""
Ingest API v1: MAT/Parquet 등록 및 cycle_summary 적재 (스텁 → 실구현 연결).
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()


class IngestReq(BaseModel):
    battery_id: str
    path: str  # 서버 기준 경로 예: data/raw/mat/B0005.mat
    source: str  # "mat" | "parquet"


@router.post("/mat")
def ingest_mat(req: IngestReq):
    """MAT 파일 파싱 → cycle_summary 적재. 실구현 시 ingest_service 연동."""
    if req.source != "mat":
        raise HTTPException(status_code=400, detail="source must be mat")
    # TODO: ingest_mat_cycle_summary(req.path, req.battery_id) → DB upsert
    return {"ok": True, "message": "MAT ingest stub", "rows": 0, "battery_id": req.battery_id}


@router.post("/parquet")
def ingest_parquet(req: IngestReq):
    """Parquet 파일 파싱 → cycle_summary 적재. 실구현 시 ingest_service 연동."""
    if req.source != "parquet":
        raise HTTPException(status_code=400, detail="source must be parquet")
    # TODO: ingest_parquet_cycle_summary(req.path, req.battery_id) → DB upsert
    return {"ok": True, "message": "Parquet ingest stub", "rows": 0, "battery_id": req.battery_id}
