import os
from contextlib import asynccontextmanager

import uvicorn
from apps.audit.router import router as audit_router
from apps.cameras.router import router as cameras_router
from apps.control.router import router as control_router
from apps.face_detection.router import router as face_detection_router
from apps.license.router import router as license_router
from apps.notifications.router import router as notifications_router
from apps.panel.router import router as panel_router
from apps.people.router import router as people_router
from core.config import settings
from core.database import close_db, init_db
from core.embedded_db import stop_embedded_postgres
from core.middleware import ControlMiddleware
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from websocket.area_detection import AreaDetectionManager
from websocket.behaviour_analysis import BehaviourAnalysisManager
from websocket.face_recognition import FaceRecognitionManager


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    try:
        yield
    finally:
        await close_db()
        stop_embedded_postgres()


app = FastAPI(
    title="SecureIT API",
    description="API do sistema de segurança SecureIT",
    version="0.2.0",
    lifespan=lifespan,
)

app.add_middleware(ControlMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(control_router, prefix="/api")
app.include_router(cameras_router, prefix="/api")
app.include_router(face_detection_router, prefix="/api")
app.include_router(notifications_router, prefix="/api")
app.include_router(panel_router, prefix="/api")
app.include_router(people_router, prefix="/api")
app.include_router(audit_router, prefix="/api")
app.include_router(license_router, prefix="/api")

settings.MEDIA_ROOT.mkdir(parents=True, exist_ok=True)
app.mount(
    "/media", StaticFiles(directory=str(settings.MEDIA_ROOT), html=False), name="media"
)


@app.get("/api/health")
async def health():
    return {"status": "ok"}


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


def main() -> None:
    port = settings.PORT or int(os.environ.get("PORT", 8000))
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=port,
        reload=False,
        log_level="info",
    )


if __name__ == "__main__":
    main()
