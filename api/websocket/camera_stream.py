import asyncio
import json
import logging
from asyncio import CancelledError, create_task, sleep as async_sleep
from datetime import datetime, timezone
from time import time
from uuid import uuid4

import cv2
import numpy as np
from fastapi import WebSocket, WebSocketDisconnect
from PIL import Image

logger = logging.getLogger(__name__)

from apps.cameras.models import Camera as CameraModel
from apps.notifications.models import Notification
from apps.panel.models import Configuration
from apps.people.service import search_by_embedding
from core.config import settings
from core.security import decode_access_token
from services.camera import CameraService
from services.facenet import detect_faces_in_frame


class CameraStreamManager:
    def __init__(self, websocket: WebSocket):
        self.websocket = websocket
        self.running = False
        self.camera_service = None
        self.camera_object = None
        self.task = None
        self.frame_index = 0
        self.last_alert = 0
        self.last_people_count = 0
        self.mst = None
        self.met = None
        self.fps = 15
        self.alert_cooldown = 5
        self.detect_every = 3
        self.allow_draw = True
        self.user_id = None
        self.camera_id = None
        self.face_recognition = False

    async def authenticate(self, token: str | None) -> bool:
        if not token:
            logger.warning("[auth] token is None")
            return False
        payload = decode_access_token(token)
        if payload is None:
            logger.warning("[auth] token decode failed")
            return False
        self.user_id = int(payload.get("sub", 0))
        if self.user_id <= 0:
            logger.warning("[auth] invalid user_id=%s", self.user_id)
            return False
        logger.info("[auth] authenticated user_id=%s", self.user_id)
        return True

    async def load_user_confs(self):
        confs = await Configuration.get_or_none(user_id=self.user_id)
        if confs:
            self.mst = confs.monitoring_start_time
            self.met = confs.monitoring_end_time
            self.fps = confs.fps
            self.alert_cooldown = confs.alert_cooldown
            self.detect_every = confs.detect_every
            self.allow_draw = confs.allow_draw

    async def get_camera_queryset(self, camera_id: int):
        self.camera_object = await CameraModel.get_or_none(
            id=camera_id, user_id=self.user_id
        )
        return self.camera_object

    async def create_notification(self, title: str, description: str, level: str, frame: bytes):
        filename = f"{uuid4()}.jpg"
        notif_path = settings.MEDIA_ROOT / "notifications_frames"
        notif_path.mkdir(parents=True, exist_ok=True)
        with open(notif_path / filename, "wb") as f:
            f.write(frame)

        await Notification.create(
            user_id=self.user_id,
            title=title,
            description=description,
            level=level,
            photo=f"notifications_frames/{filename}",
            camera_id=self.camera_id,
        )

    async def update_camera_status(self, status: bool):
        if self.camera_object and status != self.camera_object.status:
            cam = await CameraModel.get_or_none(id=self.camera_object.id)
            if cam:
                cam.status = status
                await cam.save()

    def is_monitoring_time(self) -> bool:
        now = datetime.now(timezone.utc).time()
        if not self.mst or not self.met:
            return True
        try:
            start = datetime.strptime(self.mst, "%H:%M").time()
            end = datetime.strptime(self.met, "%H:%M").time()
        except (ValueError, TypeError):
            return True
        if start <= end:
            return start <= now < end
        return now >= start or now < end

    def check_cooldown(self) -> bool:
        return time() - self.last_alert > self.alert_cooldown

    async def _cleanup(self, cancel_task: bool = True, reason: str = ""):
        logger.info("[cleanup] reason=%s user=%s camera=%s", reason, self.user_id, self.camera_id)
        self.running = False
        if self.camera_service:
            logger.info("[cleanup] releasing camera resource")
            self.camera_service.stop()
            self.camera_service = None
        if cancel_task and self.task:
            logger.info("[cleanup] cancelling stream task")
            self.task.cancel()
            self.task = None
        await self.update_camera_status(False)
        logger.info("[cleanup] done user=%s camera=%s", self.user_id, self.camera_id)

    async def stream_face_recognition(self):
        last_faces: list[dict] = []
        self.camera_service.allow_draw = False  # no YOLO drawing

        try:
            while self.running:
                self.frame_index += 1
                detect = self.frame_index % (self.detect_every * 5) == 0  # ~every 1s at 15fps
                frame, _ = self.camera_service.get_frame(detect=False)
                pil_img = None
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

                # Draw face boxes on frame
                if faces:
                    for f in faces:
                        x1, y1, x2, y2 = f["bbox"]
                        color = (0, 255, 0) if f.get("person_id") else (0, 0, 255)
                        cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
                        label = f.get("name") or "Desconhecido"
                        cv2.putText(
                            frame, label, (x1, y1 - 5),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2,
                        )

                _, jpeg = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 70])
                await self.websocket.send_bytes(jpeg.tobytes())

                if detect and faces:
                    await self.websocket.send_text(
                        json.dumps({"type": "faces", "faces": faces})
                    )

                await async_sleep(1 / self.fps)
        except CancelledError:
            logger.info("[stream_fr] cancelled user=%s camera=%s", self.user_id, self.camera_id)
        except WebSocketDisconnect:
            logger.info("[stream_fr] websocket disconnect user=%s camera=%s", self.user_id, self.camera_id)
            await self._cleanup(cancel_task=False, reason="ws_disconnect")
        finally:
            self.running = False

    async def stream(self):
        try:
            while self.running:
                self.frame_index += 1
                detect = self.frame_index % self.detect_every == 0

                try:
                    frame, people = self.camera_service.get_frame(detect)
                    if detect and people:
                        if (
                            self.is_monitoring_time()
                            and self.check_cooldown()
                            and people != self.last_people_count
                        ):
                            create_task(
                                self.create_notification(
                                    title=f"Detectadas {people} pessoa(s)",
                                    description="Foram avistados alguns possíveis suspeitos em horário de monitoramento",
                                    level="S",
                                    frame=frame,
                                )
                            )
                            await self.websocket.send_text(
                                json.dumps({"type": "notification", "people": people})
                            )
                            self.last_alert = time()
                            self.last_people_count = people
                except Exception as e:
                    logger.warning(
                        "[stream] get_frame failed user=%s camera=%s err=%s",
                        self.user_id, self.camera_id, e,
                    )
                    break

                await self.websocket.send_bytes(frame)
                await async_sleep(1 / self.fps)
        except CancelledError:
            logger.info("[stream] cancelled user=%s camera=%s", self.user_id, self.camera_id)
        except WebSocketDisconnect:
            logger.info("[stream] websocket disconnect user=%s camera=%s", self.user_id, self.camera_id)
            await self._cleanup(cancel_task=False, reason="ws_disconnect")
        finally:
            self.running = False

    async def handle(self):
        query_params = self.websocket.query_params
        token = query_params.get("token")
        camera_id = query_params.get("camera_id")
        video_source = query_params.get("vs")

        logger.info(
            "[handle] new connection camera_id=%s vs=%s",
            camera_id, video_source,
        )

        if not await self.authenticate(token):
            logger.warning("[handle] auth failed, closing camera_id=%s", camera_id)
            await self.websocket.close(code=4001)
            return

        await self.websocket.accept()
        logger.info("[handle] websocket accepted user=%s", self.user_id)

        await self.load_user_confs()

        try:
            if camera_id:
                self.camera_id = int(camera_id)
                await self.get_camera_queryset(self.camera_id)
                if self.camera_object:
                    self.face_recognition = self.camera_object.face_recognition
                    logger.info(
                        "[handle] camera found id=%s face_recognition=%s",
                        self.camera_id, self.face_recognition,
                    )
                else:
                    logger.warning("[handle] camera not found id=%s", self.camera_id)

            logger.info(
                "[handle] opening camera vs=%s fps=%s",
                video_source, self.fps,
            )
            self.camera_service = CameraService(
                video_source, fps=self.fps, allow_draw=self.allow_draw
            )
            await self.update_camera_status(True)
            logger.info("[handle] camera opened successfully")
        except Exception as e:
            logger.error("[handle] failed to open camera: %s", e)
            await self.update_camera_status(False)
            await self.websocket.close(code=4001)
            return

        self.running = True
        stream_fn = self.stream_face_recognition if self.face_recognition else self.stream
        self.task = create_task(stream_fn())
        logger.info("[handle] stream task started user=%s camera=%s", self.user_id, self.camera_id)

        try:
            await self.task
            logger.info("[handle] stream task finished normally user=%s camera=%s", self.user_id, self.camera_id)
        except CancelledError:
            logger.info("[handle] handle cancelled user=%s camera=%s", self.user_id, self.camera_id)
        except WebSocketDisconnect:
            logger.info("[handle] websocket disconnect (outer) user=%s camera=%s", self.user_id, self.camera_id)
        finally:
            await self._cleanup(reason="handle_end")
            logger.info("[handle] connection fully closed user=%s camera=%s", self.user_id, self.camera_id)
