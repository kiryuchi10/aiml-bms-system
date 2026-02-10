"""
Features API v1: feature_store 빌드/조회 (스텁 → 실구현 연결).
"""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import List

router = APIRouter()


class BuildReq(BaseModel):
    battery_ids: List[str]
    window_tag: str = "cycle"
    overwrite: bool = False


class QueryReq(BaseModel):
    battery_id: str
    start_cycle: int = 1
    end_cycle: int = 300
    window_tag: str = "cycle"


@router.post("/build")
def build_features(req: BuildReq):
    """cycle_summary → feature_store 생성. 실구현 시 feature_service 연동."""
    # TODO: DB cycle_summary 조회 → build_basic_features() → feature_store upsert
    return {
        "ok": True,
        "message": "build features stub",
        "written": 0,
        "battery_ids": req.battery_ids,
    }


@router.post("/query")
def query_features(req: QueryReq):
    """feature_store 조회. 실구현 시 DB 조회."""
    return {
        "ok": True,
        "message": "query features stub",
        "rows": [],
    }
