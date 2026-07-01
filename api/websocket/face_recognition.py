import asyncio
import json
import logging
from asyncio import CancelledError, create_task, sleep as async_sleep

import cv2
import numpy as np
from fastapi import WebSocket, WebSocketDisconnect
from PIL import Image

from apps.people.service import search_by_embedding
from services.facenet import detect_faces_in_frame
from websocket.helpers import (
    authenticate,
    create_camera_service,
    get_user_camera,
    load_user_config,
    set_camera_status,
)

logger = logging.getLogger(__name__)


class FaceRecognitionManager:
    def __init__(self, websocket: WebSocket):
        self.ws = websocket
        self.running = False
        self.camera_service = None
        self.camera = None
        self.task = None
        self.user_id = None
        self.camera_id = None
        self.frame_index = 0
        self.fps = 15
        self.detect_every = 3

    async def _cleanup(self, reason: str = ""):
        logger.info("[fr] cleanup reason=%s user=%s camera=%s", reason, self.user_id, self.camera_id)
        self.running = False
        if self.camera_service:
            self.camera_service.stop()
            self.camera_service = None
        if self.task:
            self.task.cancel()
            self.task = None
        await set_camera_status(self.camera, False)

    async def stream(self):
        last_faces: list[dict] = []

        try:
            while self.running:
                self.frame_index += 1
                detect = self.frame_index % (self.detect_every * 5) == 0

                frame, _ = self.camera_service.get_frame(detect=False)
                faces: list[dict] = []

                if detect:
                    try:
                        pil_img = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
                        detected = await asyncio.to_thread(detect_faces_in_frame, pil_img, 0.9)
                        for d in detected:
                            person = await search_by_embedding(
                                np.frombuffer(d["embedding"], dtype=np.float32).tolist()
                            )
                            faces.append({
                                "bbox": d["bbox"],
                                "person_id": person.id if person else None,
                                "name": person.full_name if person else None,
                                "unknown": person is None,
                                "confidence": d["probability"],
                            })
                        last_faces = faces
                    except Exception:
                        faces = last_faces
                else:
                    faces = last_faces

                if faces:
                    for f in faces:
                        x1, y1, x2, y2 = f["bbox"]
                        color = (0, 255, 0) if f.get("person_id") else (0, 0, 255)
                        cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
                        label = f.get("name") or "Desconhecido"
                        cv2.putText(frame, label, (x1, y1 - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)

                _, jpeg = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 70])
                await self.ws.send_bytes(jpeg.tobytes())

                if detect and faces:
                    await self.ws.send_text(json.dumps({"type": "faces", "faces": faces}))

                await async_sleep(1 / self.fps)
        except CancelledError:
            logger.info("[fr] cancelled user=%s camera=%s", self.user_id, self.camera_id)
        except WebSocketDisconnect:
            logger.info("[fr] disconnect user=%s camera=%s", self.user_id, self.camera_id)
            await self._cleanup(reason="ws_disconnect")
        finally:
            self.running = False

    async def handle(self):
        params = self.ws.query_params
        token = params.get("token")
        camera_id = params.get("camera_id")
        video_source = params.get("vs")

        logger.info("[fr] new connection camera_id=%s vs=%s", camera_id, video_source)

        user_id = await authenticate(token)
        if not user_id:
            await self.ws.close(code=4001)
            return
        self.user_id = user_id

        await self.ws.accept()
        logger.info("[fr] accepted user=%s", self.user_id)

        config = await load_user_config(self.user_id)
        self.fps = config.get("fps", self.fps)
        self.detect_every = config.get("detect_every", self.detect_every)

        try:
            if camera_id:
                self.camera_id = int(camera_id)
                self.camera = await get_user_camera(self.camera_id, self.user_id)
                if not self.camera:
                    logger.warning("[fr] camera not found id=%s", self.camera_id)

            logger.info("[fr] opening camera vs=%s fps=%s", video_source, self.fps)
            self.camera_service = create_camera_service(video_source, fps=self.fps, allow_draw=False)
            await set_camera_status(self.camera, True)
            logger.info("[fr] camera opened successfully")
        except Exception as e:
            logger.error("[fr] failed to open camera: %s", e)
            await set_camera_status(self.camera, False)
            await self.ws.close(code=4001)
            return

        self.running = True
        self.task = create_task(self.stream())
        logger.info("[fr] stream started user=%s camera=%s", self.user_id, self.camera_id)

        try:
            await self.task
            logger.info("[fr] stream finished user=%s camera=%s", self.user_id, self.camera_id)
        except (CancelledError, WebSocketDisconnect):
            logger.info("[fr] handle interrupted user=%s camera=%s", self.user_id, self.camera_id)
        finally:
            await self._cleanup(reason="handle_end")
            logger.info("[fr] closed user=%s camera=%s", self.user_id, self.camera_id)
