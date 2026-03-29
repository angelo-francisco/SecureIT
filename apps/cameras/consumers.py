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
from .services import Camera


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
        except Exception as e:
            print(e)
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
                            create_task(self.create_notification(
                                title=f"Detectadas {people} pessoa(s)",
                                description="Foram avistados alguns possíveis suspeitos em horário de monitoramneto",
                                level="S",
                                photo=ContentFile(frame, f"{uuid4()}.jpg"),
                                camera_id=self.scope["url_route"]["kwargs"][
                                    "camera_id"
                                ],
                            ))
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
                except Exception as e: # NOQA
                    print(e)
                    break

                await self.send(bytes_data=frame)
                await async_sleep(1 / self.fps)
        except CancelledError:
            pass
