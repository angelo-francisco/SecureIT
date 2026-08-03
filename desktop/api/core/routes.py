import os
import threading
import time

from fastapi import APIRouter, WebSocket

from core.embedded_db import stop_embedded_postgres
from websocket import (
    AreaDetectionManager,
    BehaviourAnalysisManager,
    FaceRecognitionManager,
)

system_router = APIRouter()


@system_router.get("/api/health")
async def health():
    return {"status": "ok"}


@system_router.post("/api/shutdown")
async def api_shutdown():
    def _shutdown() -> None:
        time.sleep(0.5)
        stop_embedded_postgres()
        os._exit(0)

    threading.Thread(target=_shutdown, daemon=True).start()
    return {"status": "shutting_down"}


@system_router.websocket("/ws/area-detection")
async def area_detection_ws(websocket: WebSocket):
    manager = AreaDetectionManager(websocket)
    await manager.handle()


@system_router.websocket("/ws/face-recognition")
async def face_recognition_ws(websocket: WebSocket):
    manager = FaceRecognitionManager(websocket)
    await manager.handle()


@system_router.websocket("/ws/behaviour-analysis")
async def behaviour_analysis_ws(websocket: WebSocket):
    manager = BehaviourAnalysisManager(websocket)
    await manager.handle()
