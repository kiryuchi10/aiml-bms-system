from fastapi import APIRouter

from app.api.v1.endpoints import auth, health, vehicles, telemetry, features, analytics, dashboard, dashboard_bms, admin, trips, charging, metrics, plot, balance

api_router = APIRouter()

api_router.include_router(health.router, prefix="/health", tags=["health"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(vehicles.router, prefix="/vehicles", tags=["vehicles"])
api_router.include_router(telemetry.router, prefix="/telemetry", tags=["telemetry"])
api_router.include_router(features.router, prefix="/features", tags=["features"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(dashboard_bms.router, prefix="/dashboard", tags=["dashboard-bms"])
api_router.include_router(plot.router, prefix="/plot", tags=["plot"])
api_router.include_router(balance.router, prefix="/balance", tags=["balance"])
api_router.include_router(trips.router, prefix="/trips", tags=["trips"])
api_router.include_router(charging.router, prefix="/charging", tags=["charging"])
api_router.include_router(metrics.router, prefix="/metrics", tags=["metrics"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
