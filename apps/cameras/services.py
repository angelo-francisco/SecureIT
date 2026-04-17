import os
from threading import Thread
from time import sleep

import cv2
from django.conf import settings
from torch.cuda import is_available as is_cuda_available
from ultralytics.models import YOLO
from ultralytics.utils import LOGGER

LOGGER.setLevel("ERROR")


class YOLOService:
    _model = None

    @classmethod
    def get_model(cls):
        if cls._model is None:
            yolo_model_path = settings.YOLO_PATH / "yolo11n.pt"
            device = "cuda" if is_cuda_available() else "cpu"

            cls._model = YOLO(yolo_model_path)
            cls._model.to(device)
        return cls._model

    @classmethod
    def predict(cls, frame, imgsz=320, conf=0.3):
        model = cls.get_model()
        return model(frame, imgsz=imgsz, conf=conf)


class Camera:
    def __init__(self, video_source, fps=15, allow_draw=True):
        self.fps = fps
        self.allow_draw = allow_draw
        self.running = True

        if not video_source:
            raise RuntimeError("Origem do vídeo não informada")

        if isinstance(video_source, str) and video_source.isdigit():
            video_source = int(video_source)

        self.video = cv2.VideoCapture(video_source)

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
            results = YOLOService.predict(frame, imgsz=320, conf=0.3)
            people = [r for r in results[0].boxes if r.cls == 0]
            people_count = len(people)

            if self.allow_draw:
                for person in people:
                    x1, y1, x2, y2 = map(int, person.xyxy[0])
                    cv2.rectangle(frame, (x1, y1), (x2, y2), (255, 0, 0), 2)

        _, jpeg = cv2.imencode(".jpg", frame, [int(cv2.IMWRITE_JPEG_QUALITY), 70])
        return jpeg.tobytes(), people_count

    def update(self):
        while self.running:
            grabbed, frame = self.video.read()
            if not grabbed:
                break
            self.frame = frame
            sleep(1 / self.fps)
