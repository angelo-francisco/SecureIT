from contextlib import asynccontextmanager

import uvicorn
from apps.control.router import router as control_router
from apps.cameras.router import router as cameras_router
from apps.face_detection.router import router as face_detection_router
from apps.notifications.router import router as notifications_router
from apps.panel.router import router as panel_router
from apps.people.router import router as people_router
from core.config import settings
from core.database import close_db, init_db
from core.middleware import ControlMiddleware
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from websocket.area_detection import AreaDetectionManager
from websocket.face_recognition import FaceRecognitionManager


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield
    await close_db()


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

settings.MEDIA_ROOT.mkdir(parents=True, exist_ok=True)
app.mount("/media", StaticFiles(directory=str(settings.MEDIA_ROOT), html=False), name="media")


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


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
