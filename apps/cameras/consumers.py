import datetime
from asyncio import CancelledError, create_task
from asyncio import sleep as async_sleep
from threading import Thread
from time import sleep, time
import json
from channels.consumer import database_sync_to_async
import cv2
import imutils
from asgiref.sync import sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer

from apps.panel.models import Configuration


ALERT_COOLDOWN = 5
DETECT_EVERY = 3
DETECTION_WIDTH = 320
FPS = 10

hog = cv2.HOGDescriptor()
hog.setSVMDetector(cv2.HOGDescriptor_getDefaultPeopleDetector())  # type: ignore


class Camera:
    def __init__(self, index: int):
        self.running = True

        self.video = cv2.VideoCapture(index)
        if not self.video.isOpened():
            raise RuntimeError("Erro ao abrir câmara")

        self.grabbed, self.frame = self.video.read()
        self.thread = Thread(target=self.update, daemon=True)
        self.thread.start()

    def stop(self) -> None:
        self.running = False

        if self.video.isOpened():
            self.video.release()

    def get_frame(self, detect: bool = True) -> tuple[bytes, int]:
        frame = self.frame
        people_count = 0

        if detect:
            small = imutils.resize(frame, width=DETECTION_WIDTH)
            regions, _ = hog.detectMultiScale(
                small, winStride=(4, 4), padding=(4, 4), scale=1.05
            )
            people_count = len(regions)

            for x, y, w, h in regions:
                cv2.rectangle(frame, (x, y), (x + w, y + h), (255, 0, 0), 1)

        _, jpeg = cv2.imencode(".jpg", frame, [int(cv2.IMWRITE_JPEG_QUALITY), 70])  # type: ignore
        return jpeg.tobytes(), people_count  # type: ignore

    def update(self):
        while self.running:
            grabbed, frame = self.video.read()
            if not grabbed:
                break
            self.frame = frame
            sleep(1 / FPS)


class CameraConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.index = self.scope["url_route"]["kwargs"]["index"]

        await self.accept()

        try:
            self.camera: Camera = await sync_to_async(Camera)(self.index)
        except Exception:
            await self.close()
            return

        self.running = True
        self.frame_index = 0
        self.last_alert = 0
        self.last_people_count = 0

        self.confs = await self.get_user_confs()
        self.task = create_task(self.stream())

    @database_sync_to_async
    def get_user_confs(self):
        return Configuration.objects.get(user=self.scope["user"])  # type: ignore

    async def disconnect(self, close_code):  # type: ignore
        self.running = False
        await sync_to_async(self.camera.stop)()
        self.task.cancel()

    def is_monitoring_time(self) -> bool:
        now = datetime.datetime.now().time()
        start = self.confs.monitoring_start_time
        end = self.confs.monitoring_end_time

        if start <= end:
            return start <= now < end
        return now >= start or now < end

    def check_cooldown(self):
        return time() - self.last_alert > ALERT_COOLDOWN

    async def stream(self):
        try:
            while self.running:
                self.frame_index += 1
                detect = self.frame_index % DETECT_EVERY == 0

                try:
                    frame, people = await sync_to_async(self.camera.get_frame)(detect)
                    if detect and people:
                        if (
                            self.is_monitoring_time()
                            and self.check_cooldown()
                            and people != self.last_people_count
                        ):
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
                except RuntimeError:
                    break

                await self.send(bytes_data=frame)
                await async_sleep(1 / FPS)
        except CancelledError:
            pass
