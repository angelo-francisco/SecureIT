import asyncio
import json
import logging
from asyncio import CancelledError, create_task, sleep as async_sleep
from time import time

import cv2
import numpy as np
from fastapi import WebSocket, WebSocketDisconnect
from PIL import Image

from apps.face_detection.service import save_face_detection
from apps.people.service import search_by_embedding
from services.facenet import detect_faces_in_frame
from websocket.helpers import (
    authenticate,
    check_license_feature,
    create_camera_service,
    get_user_camera,
    load_user_config,
    set_camera_status,
    websocket_watchdog,
)
from websocket.registry import register_manager, unregister_manager

logger = logging.getLogger(__name__)


class FaceRecognitionManager:
    def __init__(self, websocket: WebSocket):
        self.ws = websocket
        self.running = False
        self.camera_service = None
        self.camera = None
        self.task = None
        self.profile_id = None
        self.camera_id = None
        self.frame_index = 0
        self.fps = 15
        self.detect_every = 10
        self.frame_errors = 0
        self._stop = asyncio.Event()
        self._watchdog_task = None
        self._notified: dict[int, float] = {}
        self._match_cooldown = 30
        self._last_unknown_save: float = 0
        self._unknown_save_cooldown = 60

    async def close(self, reason: str = ""):
        self._stop.set()
        if self.task:
            self.task.cancel()
        try:
            await self.ws.close(code=1000, reason=reason)
        except Exception:
            pass

    async def _cleanup(self, reason: str = ""):
        self.running = False
        self._stop.set()
        if self.camera_service:
            self.camera_service.stop()
            self.camera_service = None
        if self.task:
            self.task.cancel()
            self.task = None
        if self.camera_id:
            await unregister_manager(self.camera_id, self)
        await set_camera_status(self.camera, False)

    async def stream(self):
        last_faces: list[dict] = []

        try:
            while self.running:
                self.frame_index += 1
                detect = self.frame_index % self.detect_every == 0

                frame = self.camera_service.frame
                if frame is None:
                    self.frame_errors += 1
                    if self.frame_errors >= 10:
                        logger.warning(
                            "no frame for camera %s (%d consecutive)",
                            self.camera_id,
                            self.frame_errors,
                        )
                        break
                    await async_sleep(1 / self.fps)
                    continue
                self.frame_errors = 0

                faces: list[dict] = []

                if detect:
                    try:
                        pil_img = Image.fromarray(
                            cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                        )
                        detected = await asyncio.to_thread(
                            detect_faces_in_frame, pil_img, 0.9
                        )
                        for d in detected:
                            person = await search_by_embedding(
                                np.frombuffer(d["embedding"], dtype=np.float32).tolist()
                            )
                            faces.append(
                                {
                                    "bbox": d["bbox"],
                                    "person_id": person.id if person else None,
                                    "name": person.full_name if person else None,
                                    "unknown": person is None,
                                    "confidence": d["probability"],
                                }
                            )
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
                        cv2.putText(
                            frame,
                            label,
                            (x1, y1 - 5),
                            cv2.FONT_HERSHEY_SIMPLEX,
                            0.5,
                            color,
                            2,
                        )

                _, jpeg = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 70])
                jpeg_bytes = jpeg.tobytes()
                await self.ws.send_bytes(jpeg_bytes)

                if detect and faces:
                    await self.ws.send_text(
                        json.dumps({"type": "faces", "faces": faces})
                    )
                    now = time()
                    for f in faces:
                        pid = f.get("person_id")
                        if pid and (
                            pid not in self._notified
                            or now - self._notified[pid] > self._match_cooldown
                        ):
                            self._notified[pid] = now
                            await self.ws.send_text(
                                json.dumps(
                                    {
                                        "type": "face_match",
                                        "person_id": pid,
                                        "name": f.get("name"),
                                        "camera_id": self.camera_id,
                                        "camera_name": self.camera.name
                                        if self.camera
                                        else None,
                                    }
                                )
                            )
                            await save_face_detection(
                                profile_id=self.profile_id,
                                person_id=pid,
                                name=f.get("name"),
                                unknown=False,
                                confidence=f.get("confidence", 0.0),
                                camera_id=self.camera_id,
                                camera_name=self.camera.name if self.camera else None,
                                frame_bytes=jpeg_bytes,
                            )
                        elif (
                            not pid
                            and now - self._last_unknown_save
                            > self._unknown_save_cooldown
                        ):
                            self._last_unknown_save = now
                            await save_face_detection(
                                profile_id=self.profile_id,
                                person_id=None,
                                name=None,
                                unknown=True,
                                confidence=f.get("confidence", 0.0),
                                camera_id=self.camera_id,
                                camera_name=self.camera.name if self.camera else None,
                                frame_bytes=jpeg_bytes,
                            )

                await async_sleep(1 / self.fps)
        except CancelledError:
            pass
        except WebSocketDisconnect:
            await self._cleanup(reason="ws_disconnect")
        finally:
            self.running = False

    async def handle(self):
        params = self.ws.query_params
        profile_id = params.get("pid")
        camera_id = params.get("camera_id")
        video_source = params.get("vs")

        pid = await authenticate(profile_id)
        if not pid:
            await self.ws.close(code=4001)
            return
        self.profile_id = pid

        if not await check_license_feature(self.profile_id, "face_recognition"):
            await self.ws.close(
                code=4001, reason="Licença não inclui Reconhecimento Facial"
            )
            return

        await self.ws.accept()

        config = await load_user_config(self.profile_id)
        self.fps = config.get("fps", self.fps)
        self.detect_every = config.get("detect_every", self.detect_every)

        try:
            if camera_id:
                self.camera_id = int(camera_id)
                self.camera = await get_user_camera(self.camera_id, self.profile_id)
                if not self.camera:
                    pass

            self.camera_service = create_camera_service(
                video_source, fps=self.fps, allow_draw=False
            )
            await set_camera_status(self.camera, True)
        except Exception:
            await set_camera_status(self.camera, False)
            await self.ws.close(code=4001)
            return

        self.running = True
        if self.camera_id:
            await register_manager(self.camera_id, self)
        self.task = create_task(self.stream())
        self._watchdog_task = create_task(
            websocket_watchdog(self.ws, self._stop, self._cleanup)
        )

        try:
            await self.task
        except (CancelledError, WebSocketDisconnect):
            pass
        finally:
            self._stop.set()
            if self._watchdog_task:
                self._watchdog_task.cancel()
            await self._cleanup(reason="handle_end")
