from fastapi import APIRouter

from app.api.routes.health import router as health_router
from app.api.routes.reference_results import router as reference_results_router
from app.api.routes.data import router as data_router
from app.api.pack import router as pack_router
from app.api.cells import router as cells_router
from app.api.timeseries import router as timeseries_router
from app.api.features import router as features_router

api_router = APIRouter()
api_router.include_router(health_router, tags=["health"])
api_router.include_router(reference_results_router, prefix="/results", tags=["results"])
api_router.include_router(data_router, tags=["data"])
api_router.include_router(pack_router, tags=["pack"])
api_router.include_router(cells_router, tags=["cells"])
api_router.include_router(timeseries_router, tags=["timeseries"])
api_router.include_router(features_router, tags=["features"])

