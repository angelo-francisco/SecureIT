from asyncio import CancelledError, create_task
from asyncio import sleep as async_sleep
from threading import Thread
from time import sleep

import cv2
import imutils
from asgiref.sync import sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer

FPS = 30

hog = cv2.HOGDescriptor()
hog.setSVMDetector(cv2.HOGDescriptor_getDefaultPeopleDetector())


class Camera:
    def __init__(self, index: int):
        self.frame_count = 0
        self.running = True

        self.video = cv2.VideoCapture(index)
        if not self.video.isOpened():
            raise RuntimeError("Erro ao abrir câmara")

        self.grabbed, self.frame = self.video.read()
        self.thread = Thread(target=self.update, daemon=True)
        self.thread.start()

    def stop(self):
        self.running = False

        if self.video.isOpened():
            self.video.release()

    def get_frame(self):
        frame = self.frame
        self.frame_count += 1

        if self.frame_count % 1 == 0:
            image = imutils.resize(frame, width=min(400, frame.shape[1]))
            (regions, _) = hog.detectMultiScale(
                image, winStride=(4, 4), padding=(4, 4), scale=1.05
            )

        for x, y, w, h in regions:
            cv2.rectangle(image, (x, y), (x + w, y + h), (255, 0, 0), 1)

        _, jpeg = cv2.imencode(".jpg", image)
        return jpeg.tobytes()

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
        except Exception as error:
            print(error)
            await self.close()
            return
        self.running = True
        self.task = create_task(self.stream_video())

    async def disconnect(self, close_code):
        self.running = False

        if hasattr(self, "camera"):
            await sync_to_async(self.camera.stop)()

        if hasattr(self, "task"):
            self.task.cancel()

    async def stream_video(self):
        try:
            while self.running:
                try:
                    frame = await sync_to_async(self.camera.get_frame)()
                except RuntimeError:
                    break

                await self.send(bytes_data=frame)

                await async_sleep(1 / FPS)
        except CancelledError:
            pass
