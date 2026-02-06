from fastapi import APIRouter

from app.api.routes.health import router as health_router
from app.api.routes.reference_results import router as reference_results_router
from app.api.routes.data import router as data_router
from app.api.routes.training import router as training_router

api_router = APIRouter()
api_router.include_router(health_router, tags=["health"])
api_router.include_router(reference_results_router, prefix="/results", tags=["results"])
api_router.include_router(data_router, tags=["data"])
api_router.include_router(training_router, prefix="/training", tags=["training"])

