import asyncio
import logging
import os
import threading
import time
from contextlib import asynccontextmanager

import core.win_hidden  # noqa: F401  (Windows: hide child console windows)
import uvicorn
from apps import ROUTERS
from apps.control.models import Profile
from core.config import settings
from core.context import current_profile_id
from core.database import after_db_startup, db_error_hint, get_tortoise_config
from core.embedded_db import stop_embedded_postgres
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.requests import Request
from tortoise import Tortoise
from tortoise.contrib.fastapi import register_tortoise
from websocket import (
    AreaDetectionManager,
    BehaviourAnalysisManager,
    FaceRecognitionManager,
)

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    if settings.EMBEDDED_DB:
        from core.embedded_db import start_embedded_postgres

        start_embedded_postgres()

    try:
        await after_db_startup()
    except Exception as exc:  # noqa: BLE001 - surface a clear DB error, not a raw traceback
        logger.exception("Database startup failed")
        await Tortoise.close_connections()
        stop_embedded_postgres()
        raise RuntimeError(db_error_hint(exc)) from exc

    try:
        yield
    finally:
        await Tortoise.close_connections()
        stop_embedded_postgres()


app = FastAPI(
    title="SecureIT API",
    description="API do sistema de segurança SecureIT",
    version="0.2.0",
    lifespan=lifespan,
)


@app.middleware("http")
async def control_middleware(request: Request, call_next):
    profile_id = request.headers.get("PID", "")
    user_id = request.headers.get("UID", "")

    token = current_profile_id.set(None)

    try:
        if profile_id and user_id:
            request.state.profile = await Profile.get_or_none(
                user_id=user_id,
                profile_id=profile_id,
            )

            if request.state.profile:
                current_profile_id.set(profile_id)

        return await call_next(request)

    finally:
        current_profile_id.reset(token)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


for router in ROUTERS:
    app.include_router(router, prefix="/api")

settings.MEDIA_ROOT.mkdir(parents=True, exist_ok=True)
app.mount(
    "/media", StaticFiles(directory=str(settings.MEDIA_ROOT), html=False), name="media"
)


@app.get("/api/health")
async def health():
    return {"status": "ok"}


@app.post("/api/shutdown")
async def api_shutdown():
    """Stop cleanly on request so the embedded PostgreSQL is not left needing
    crash recovery on the next launch (a force-kill would leave it "interrupted"
    and every following boot would stall on Windows log recovery)."""

    def _shutdown() -> None:
        time.sleep(0.5)  # let the HTTP response flush before exiting
        stop_embedded_postgres()
        os._exit(0)

    threading.Thread(target=_shutdown, daemon=True).start()
    return {"status": "shutting_down"}


@app.websocket("/ws/area-detection")
async def area_detection_ws(websocket: WebSocket):
    manager = AreaDetectionManager(websocket)
    await manager.handle()


@app.websocket("/ws/face-recognition")
async def face_recognition_ws(websocket: WebSocket):
    manager = FaceRecognitionManager(websocket)
    await manager.handle()


@app.websocket("/ws/behaviour-analysis")
async def behaviour_analysis_ws(websocket: WebSocket):
    manager = BehaviourAnalysisManager(websocket)
    await manager.handle()


if settings.EMBEDDED_DB:
    from core.embedded_db import (
        start_embedded_postgres,
        wait_for_embedded_postgres,
    )

    start_embedded_postgres()
    asyncio.run(wait_for_embedded_postgres())

register_tortoise(app, config=get_tortoise_config(), generate_schemas=False)


def main() -> None:
    port = settings.PORT or int(os.environ.get("PORT", 8000))
    uvicorn.run(
        app, host="0.0.0.0", port=port, reload=False, log_level="info", lifespan="on"
    )


if __name__ == "__main__":
    main()
