from contextlib import asynccontextmanager

import uvicorn
from apps.auth.router import router as auth_router
from apps.cameras.router import router as cameras_router
from apps.notifications.router import router as notifications_router
from apps.panel.router import router as panel_router
from apps.people.router import router as people_router
from core.config import settings
from core.database import close_db, init_db
from websocket.camera_stream import CameraStreamManager
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles


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

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api")
app.include_router(cameras_router, prefix="/api")
app.include_router(notifications_router, prefix="/api")
app.include_router(panel_router, prefix="/api")
app.include_router(people_router, prefix="/api")

if settings.MEDIA_ROOT.exists():
    app.mount("/media", StaticFiles(directory=str(settings.MEDIA_ROOT)), name="media")


@app.get("/api/health")
async def health():
    return {"status": "ok"}


@app.websocket("/ws/camera")
async def camera_websocket(websocket: WebSocket):
    manager = CameraStreamManager(websocket)
    await manager.handle()


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
