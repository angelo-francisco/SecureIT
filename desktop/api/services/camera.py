import logging
from threading import Thread
from time import sleep

import cv2

logger = logging.getLogger(__name__)

VIDEO_EXTENSIONS = (".mp4", ".avi", ".mov", ".mkv", ".flv", ".wmv", ".webm")


def _is_video_file(path: str) -> bool:
    return any(path.lower().endswith(ext) for ext in VIDEO_EXTENSIONS)


class CameraService:
    def __init__(self, video_source, fps=15, allow_draw=True):
        self.allow_draw = allow_draw
        self.running = True
        self.is_video_file = False

        if not video_source:
            raise RuntimeError("Origem do vídeo não informada")

        if isinstance(video_source, str) and video_source.isdigit():
            video_source = int(video_source)
        elif isinstance(video_source, str) and _is_video_file(video_source):
            self.is_video_file = True

        for attempt in range(3):
            self.video = cv2.VideoCapture(video_source)
            if self.video.isOpened():
                logger.info(
                    "camera opened on attempt %d source=%s", attempt + 1, video_source
                )
                break
            logger.warning(
                "camera NOT opened attempt %d source=%s", attempt + 1, video_source
            )
            self.video.release()
            sleep(0.5)
        else:
            logger.error("camera failed after 3 attempts source=%s", video_source)
            raise RuntimeError("Erro ao abrir câmara após várias tentativas")

        if self.is_video_file:
            raw_fps = self.video.get(cv2.CAP_PROP_FPS)
            if raw_fps > 0:
                fps = raw_fps
            self.total_frames = int(self.video.get(cv2.CAP_PROP_FRAME_COUNT))
            logger.info("video file fps=%.2f total_frames=%s", fps, self.total_frames)

        self.fps = fps

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
        from services.yolo import YOLOService  # lazy import

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
                if self.is_video_file:
                    self.video.set(cv2.CAP_PROP_POS_FRAMES, 0)
                    grabbed, frame = self.video.read()
                    if not grabbed:
                        break
                else:
                    break
            self.frame = frame
            sleep(1 / self.fps)
