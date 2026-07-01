import logging
from threading import Thread
from time import sleep

import cv2

from services.yolo import YOLOService

logger = logging.getLogger(__name__)


class CameraService:
    def __init__(self, video_source, fps=15, allow_draw=True):
        self.fps = fps
        self.allow_draw = allow_draw
        self.running = True

        if not video_source:
            raise RuntimeError("Origem do vídeo não informada")

        if isinstance(video_source, str) and video_source.isdigit():
            video_source = int(video_source)

        for attempt in range(3):
            self.video = cv2.VideoCapture(video_source)
            if self.video.isOpened():
                logger.info("camera opened on attempt %d source=%s", attempt + 1, video_source)
                break
            logger.warning("camera NOT opened attempt %d source=%s", attempt + 1, video_source)
            self.video.release()
            sleep(0.5)
        else:
            logger.error("camera failed after 3 attempts source=%s", video_source)
            raise RuntimeError("Erro ao abrir câmara após várias tentativas")

        self.grabbed, self.frame = self.video.read()
        if not self.grabbed:
            logger.warning("first frame not grabbed source=%s", video_source)
        self.thread = Thread(target=self.update, daemon=True)
        self.thread.start()
        logger.info("capture thread started source=%s", video_source)

    def stop(self) -> None:
        logger.info("stopping camera service")
        self.running = False

        if self.video.isOpened():
            self.video.release()
            logger.info("camera released")
            sleep(0.3)

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
