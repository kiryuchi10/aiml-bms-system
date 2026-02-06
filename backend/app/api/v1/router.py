"""
API v1 router: telemetry, dashboard, analytics, ML, cells, WebSocket.
"""

from fastapi import APIRouter

from app.api.v1.endpoints import telemetry, dashboard, analytics, ml, cells
from app.api.v1 import ws_bms

v1_router = APIRouter()

v1_router.include_router(telemetry.router, prefix="/telemetry", tags=["v1-telemetry"])
v1_router.include_router(dashboard.router, prefix="/dashboard", tags=["v1-dashboard"])
v1_router.include_router(cells.router, prefix="/cells", tags=["v1-cells"])
v1_router.include_router(analytics.router, prefix="/analytics", tags=["v1-analytics"])
v1_router.include_router(ml.router, prefix="/ml", tags=["v1-ml"])
v1_router.include_router(ws_bms.router, tags=["v1-ws"])
