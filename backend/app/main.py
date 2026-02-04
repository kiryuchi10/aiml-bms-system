"""
AIML-BMS FastAPI app: REST + WebSocket for BMS dashboard.
BMS Master/Slave/PMDU simulation; safety-critical logic separate from AI/ML.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine

from app.api.v1.router import api_router
from app.api.ws.bms_ws import ws_router
from app.core.config import settings
from app.services.bms_store import DataStore
from app.services.bms_streamer import Streamer
from app.api.ws.manager import WSManager


def create_app() -> FastAPI:
    app = FastAPI(title=settings.app_name)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allow_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(api_router, prefix="/api/v1")
    app.include_router(ws_router, prefix="/api/v1")

    @app.on_event("startup")
    async def on_startup():
        engine = create_engine(settings.database_url, pool_pre_ping=True)
        app.state.engine = engine
        app.state.bms_store = DataStore(engine=engine)
        app.state.ws_manager = WSManager()
        app.state.bms_streamer = Streamer(
            store=app.state.bms_store,
            default_vehicle_id=getattr(settings, "bms_vehicle_id", "MBM165-P50-B"),
            rate_hz=2.0,
        )

    return app


app = create_app()
