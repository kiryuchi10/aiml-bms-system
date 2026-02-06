from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.api.websocket_bms import ws_router
from app.api.v1.router import v1_router
from app.ws.bms_ws import router as ws_db_router
from app.core.config import settings


def create_app() -> FastAPI:
    app = FastAPI(title=settings.app_name)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allow_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(api_router, prefix="/api")
    app.include_router(v1_router, prefix="/api/v1")
    app.include_router(ws_router)
    app.include_router(ws_db_router)  # DB replay at /ws/bms/db
    return app


app = create_app()

