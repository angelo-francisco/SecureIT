import json
from asyncio import CancelledError, create_task, sleep as async_sleep
from datetime import datetime, timezone
from time import time
from uuid import uuid4

from fastapi import WebSocket, WebSocketDisconnect

from apps.cameras.models import Camera as CameraModel
from apps.notifications.models import Notification
from apps.panel.models import Configuration
from core.config import settings
from core.security import decode_access_token
from services.camera import CameraService


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

    async def authenticate(self, token: str | None) -> bool:
        if not token:
            return False
        payload = decode_access_token(token)
        if payload is None:
            return False
        self.user_id = int(payload.get("sub", 0))
        return self.user_id > 0

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
        if self.mst <= self.met:
            return self.mst <= now < self.met
        return now >= self.mst or now < self.met

    def check_cooldown(self) -> bool:
        return time() - self.last_alert > self.alert_cooldown

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
                except Exception:
                    break

                await self.websocket.send_bytes(frame)
                await async_sleep(1 / self.fps)
        except CancelledError:
            pass

    async def handle(self):
        query_params = self.websocket.query_params
        token = query_params.get("token")
        camera_id = query_params.get("camera_id")
        video_source = query_params.get("vs")

        if not await self.authenticate(token):
            await self.websocket.close(code=4001)
            return

        await self.websocket.accept()
        await self.load_user_confs()

        try:
            if camera_id:
                self.camera_id = int(camera_id)
                await self.get_camera_queryset(self.camera_id)

            self.camera_service = CameraService(
                video_source, fps=self.fps, allow_draw=self.allow_draw
            )
            await self.update_camera_status(True)
        except Exception:
            await self.update_camera_status(False)
            await self.websocket.close(code=4001)
            return

        self.running = True
        self.task = create_task(self.stream())

        try:
            while self.running:
                await async_sleep(1)
        except WebSocketDisconnect:
            self.running = False
            if self.camera_service:
                self.camera_service.stop()
            if self.task:
                self.task.cancel()
            await self.update_camera_status(False)
