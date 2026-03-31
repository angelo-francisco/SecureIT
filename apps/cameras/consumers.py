import json
from asyncio import CancelledError, create_task
from asyncio import sleep as async_sleep
from time import time
from urllib.parse import parse_qs
from uuid import uuid4

from asgiref.sync import sync_to_async
from channels.consumer import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from django.core.files.base import ContentFile
from django.utils import timezone

from apps.notifications.models import Notification
from apps.panel.models import Configuration

from .models import Camera as CameraModel
from .models import DetectionLine
from .services import Camera, RawCamera


class RawCameraConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        camera_id = self.scope["url_route"]["kwargs"]["camera_id"]
        query_params = parse_qs(self.scope["query_string"].decode())
        self.video_source = query_params.get("vs", [None])[0]

        await self.accept()

        try:
            self.camera_object = await self.get_camera_queryset(camera_id)
            self.camera = await sync_to_async(RawCamera)(self.video_source)
            await self.update_camera_status(True)
        except Exception:
            await self.update_camera_status(False)
            await self.close()
            return

        self.running = True
        self.task = create_task(self.stream())

    @database_sync_to_async
    def get_camera_queryset(self, camera_id: int):
        return CameraModel.objects.get(id=camera_id)

    @database_sync_to_async
    def update_camera_status(self, status: bool):
        if not hasattr(self, "camera_object"):
            return None

        if status != self.camera_object.status:
            self.camera_object.status = status
            self.camera_object.save(update_fields=["status"])

    async def disconnect(self, code) -> None:
        self.running = False

        if hasattr(self, "camera"):
            await sync_to_async(self.camera.stop)()

        if hasattr(self, "task"):
            self.task.cancel()

    async def stream(self):
        try:
            while self.running:
                frame = await sync_to_async(self.camera.get_frame)()
                await self.send(bytes_data=frame)
                await async_sleep(1 / 5)
        except CancelledError:
            pass


class CameraConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        camera_id = self.scope["url_route"]["kwargs"]["camera_id"]
        query_params = parse_qs(self.scope["query_string"].decode())
        self.video_source = query_params.get("vs", [None])[0]

        await self.accept()
        await self.load_user_confs()

        try:
            self.camera_object = await self.get_camera_queryset(camera_id)
            self.camera = await sync_to_async(Camera)(
                self.video_source, fps=self.fps, allow_draw=self.allow_draw
            )
            await self.update_camera_status(True)
        except Exception:
            await self.update_camera_status(False)
            await self.close()
            return

        self.running = True
        self.frame_index = 0
        self.last_alert = 0
        self.last_people_count = 0
        self.task = create_task(self.stream())

    @database_sync_to_async
    def load_user_confs(self):
        confs = Configuration.objects.get(user=self.scope["user"])
        self.mst = confs.monitoring_start_time
        self.met = confs.monitoring_end_time
        self.fps = confs.fps
        self.alert_cooldown = confs.alert_cooldown
        self.detect_every = confs.detect_every
        self.allow_draw = confs.allow_draw

    @database_sync_to_async
    def create_notification(
        self, title: str, description: str, level: str, photo=None, camera_id=None
    ):
        return Notification.objects.create(
            user=self.scope["user"],
            description=description,
            title=title,
            level=level,
            photo=photo,
            camera_id=camera_id,
        )

    @database_sync_to_async
    def get_notifications_count(self, readed=False):
        return Notification.objects.filter(
            user=self.scope["user"], deleted=False, readed=readed
        ).count()

    @database_sync_to_async
    def get_camera_queryset(self, camera_id: int):
        return CameraModel.objects.get(id=camera_id)

    @database_sync_to_async
    def update_camera_status(self, status: bool):
        if not hasattr(self, "camera_object"):
            return None

        if status != self.camera_object.status:
            self.camera_object.status = status
            self.camera_object.save(update_fields=["status"])

    async def disconnect(self, code) -> None:
        self.running = False

        if hasattr(self, "camera"):
            await sync_to_async(self.camera.stop)()

        if hasattr(self, "task"):
            self.task.cancel()

    def is_monitoring_time(self) -> bool:
        now = timezone.now().time()
        start = self.mst
        end = self.met
        if start <= end:
            return start <= now < end
        return now >= start or now < end

    def check_cooldown(self):
        return time() - self.last_alert > self.alert_cooldown

    async def stream(self):
        try:
            while self.running:
                self.frame_index += 1
                detect = self.frame_index % self.detect_every == 0

                try:
                    frame, people = await sync_to_async(self.camera.get_frame)(detect)
                    if detect and people:
                        if (
                            self.is_monitoring_time()
                            and self.check_cooldown()
                            and people != self.last_people_count
                        ):
                            create_task(
                                self.create_notification(
                                    title=f"Detectadas {people} pessoa(s)",
                                    description="Foram avistados alguns possíveis suspeitos em horário de monitoramneto",
                                    level="S",
                                    photo=ContentFile(frame, f"{uuid4()}.jpg"),
                                    camera_id=self.scope["url_route"]["kwargs"][
                                        "camera_id"
                                    ],
                                )
                            )
                            await self.send(
                                text_data=json.dumps(
                                    {
                                        "type": "notification",
                                        "people": people,
                                    }
                                )
                            )
                            self.last_alert = time()
                            self.last_people_count = people
                except Exception as e:  # NOQA
                    break

                await self.send(bytes_data=frame)
                await async_sleep(1 / self.fps)
        except CancelledError:
            pass


class AreaDetectionConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        camera_id = self.scope["url_route"]["kwargs"]["camera_id"]
        query_params = parse_qs(self.scope["query_string"].decode())
        self.video_source = query_params.get("vs", [None])[0]

        await self.accept()
        await self.load_user_confs()

        try:
            self.camera_object = await self.get_camera_queryset(camera_id)
            self.line = await self.get_detection_line(camera_id)

            if not self.line:
                await self.close()
                return

            self.camera = await sync_to_async(Camera)(
                self.video_source, fps=self.fps, allow_draw=True
            )

            await self.update_camera_status(True)

        except Exception:
            await self.update_camera_status(False)
            await self.close()
            return

        self.running = True
        self.frame_index = 0
        self.last_alert = 0
        self.prev_positions = {}
        self.task = create_task(self.stream())

    async def disconnect(self, code):
        self.running = False

        if hasattr(self, "camera"):
            await sync_to_async(self.camera.stop)()

        if hasattr(self, "task"):
            self.task.cancel()

    @database_sync_to_async
    def get_camera_queryset(self, camera_id):
        return CameraModel.objects.get(id=camera_id)

    @database_sync_to_async
    def get_detection_line(self, camera_id):
        try:
            return DetectionLine.objects.get(camera_id=camera_id)
        except DetectionLine.DoesNotExist:
            return None

    @database_sync_to_async
    def load_user_confs(self):
        confs = Configuration.objects.get(user=self.scope["user"])
        self.fps = confs.fps
        self.alert_cooldown = confs.alert_cooldown
        self.detect_every = confs.detect_every
        self.mst = confs.monitoring_start_time
        self.met = confs.monitoring_end_time

    @database_sync_to_async
    def update_camera_status(self, status):
        if hasattr(self, "camera_object") and self.camera_object.status != status:
            self.camera_object.status = status
            self.camera_object.save(update_fields=["status"])

    @database_sync_to_async
    def create_notification(self, frame, camera_id):
        return Notification.objects.create(
            user=self.scope["user"],
            title="Intrusão detectada",
            description="Um objeto cruzou a área restrita",
            level="S",
            photo=ContentFile(frame, f"{uuid4()}.jpg"),
            camera_id=camera_id,
        )

    def is_monitoring_time(self):
        now = timezone.now().time()
        if self.mst <= self.met:
            return self.mst <= now < self.met
        return now >= self.mst or now < self.met

    def check_cooldown(self):
        return time() - self.last_alert > self.alert_cooldown

    def side(self, px, py, x1, y1, x2, y2):
        return (px - x1) * (y2 - y1) - (py - y1) * (x2 - x1)

    async def stream(self):
        try:
            while self.running:
                self.frame_index += 1
                detect = self.frame_index % self.detect_every == 0

                frame, _ = await sync_to_async(self.camera.get_frame)(detect)

                if detect:
                    results = await sync_to_async(self.camera.get_frame)(True)
                    frame_bytes, _ = results

                    import cv2
                    import numpy as np

                    frame_np = cv2.imdecode(
                        np.frombuffer(frame_bytes, np.uint8), cv2.IMREAD_COLOR
                    )

                    h, w = frame_np.shape[:2]

                    x1 = int(self.line.x1 * w)
                    y1 = int(self.line.y1 * h)
                    x2 = int(self.line.x2 * w)
                    y2 = int(self.line.y2 * h)

                    results = await sync_to_async(self.camera.get_frame)(True)

                    from .services import YOLOService

                    preds = YOLOService.predict(frame_np)

                    for i, person in enumerate(preds[0].boxes):
                        if person.cls != 0:
                            continue

                        px1, py1, px2, py2 = map(int, person.xyxy[0])
                        cx = (px1 + px2) // 2
                        cy = (py1 + py2) // 2

                        current_side = self.side(cx, cy, x1, y1, x2, y2)

                        prev = self.prev_positions.get(i)

                        if prev is not None:
                            if current_side * prev < 0:
                                if self.is_monitoring_time() and self.check_cooldown():
                                    create_task(
                                        self.create_notification(
                                            frame_bytes,
                                            self.scope["url_route"]["kwargs"][
                                                "camera_id"
                                            ],
                                        )
                                    )

                                    await self.send(
                                        text_data=json.dumps({"type": "intrusion"})
                                    )

                                    self.last_alert = time()

                        self.prev_positions[i] = current_side

                await self.send(bytes_data=frame)
                await async_sleep(1 / self.fps)

        except CancelledError:
            pass
