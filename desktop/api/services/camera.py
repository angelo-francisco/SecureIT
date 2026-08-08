import logging
from threading import Thread
from time import sleep
from platform import system
import cv2

logger = logging.getLogger(__name__)

SYSTEM = system()
VIDEO_EXTENSIONS = (".mp4", ".avi", ".mov", ".mkv", ".flv", ".wmv", ".webm")


def _is_video_file(path: str) -> bool:
    return any(path.lower().endswith(ext) for ext in VIDEO_EXTENSIONS)


def _split_windows_id(source: int) -> tuple[int, int] | None:
    """Split a combined capture id (``backend + index``) into its parts.

    ``cv2_enumerate_cameras`` reports device ids as ``backend + index`` so a
    single number is unique across backends. ``cv2.VideoCapture`` expects the
    plain per-backend index, so the id must be split before opening.
    """
    for backend in (cv2.CAP_DSHOW, cv2.CAP_MSMF):
        if backend <= source < backend + 100:
            return source - backend, backend
    return None


class CameraService:
    def __init__(self, video_source, fps=15, allow_draw=True):
        self.allow_draw = allow_draw
        self.running = True
        self.is_video_file = False

        if not video_source:
            raise RuntimeError("Origem do vídeo não informada")

        if isinstance(video_source, str) and _is_video_file(video_source):
            self.is_video_file = True
        if isinstance(video_source, str) and video_source.isdigit():
            video_source = int(video_source)

        # Forced backends are only useful for live devices. Video files and
        # URLs (RTSP/HTTP) must use the default backend (FFMPEG), otherwise
        # CAP_DSHOW/CAP_V4L2 fail to open them on Windows/Linux.
        backends = [0]
        if SYSTEM == "Linux":
            backends = [cv2.CAP_V4L2, 0]
        elif SYSTEM == "Windows" and isinstance(video_source, int):
            split = _split_windows_id(video_source)
            if split is not None:
                index, backend = split
                video_source = index
                backends = [backend, 0]
            else:
                backends = [cv2.CAP_DSHOW, 0]

        logger.info(
            "opening video_source=%s type=%s backends=%s",
            str(video_source),
            type(video_source),
            backends,
        )
        self.video = None
        for attempt in range(3):
            for backend in backends:
                try:
                    video = cv2.VideoCapture(video_source, backend)
                except Exception:
                    video = None
                if video is not None and video.isOpened():
                    self.video = video
                    logger.info(
                        "camera opened on attempt %d source=%s backend=%s",
                        attempt + 1,
                        video_source,
                        backend,
                    )
                    break
                if video is not None:
                    video.release()
            if self.video is not None:
                break
            logger.info(
                "camera NOT opened attempt %d source=%s", attempt + 1, video_source
            )
            sleep(0.5)
        else:
            logger.info("camera failed after 3 attempts source=%s", video_source)
            raise RuntimeError("Erro ao abrir câmara após várias tentativas")

        self.grabbed, self.frame = self.video.read()

        if self.is_video_file and not self.grabbed:
            logger.info(
                "OpenCV could not decode %s; falling back to PyAV reader",
                video_source,
            )
            if self.video.isOpened():
                self.video.release()
            from services.av_reader import AVReader  # lazy import

            self.video = AVReader(str(video_source))
            self.grabbed, self.frame = self.video.read()

        if self.is_video_file:
            raw_fps = self.video.get(cv2.CAP_PROP_FPS)
            if raw_fps > 0:
                fps = raw_fps
            self.total_frames = int(self.video.get(cv2.CAP_PROP_FRAME_COUNT))
            logger.info("video file fps=%.2f total_frames=%s", fps, self.total_frames)

        self.fps = fps

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
        if frame is None:
            grabbed, frame = self.video.read()
            if not grabbed:
                raise RuntimeError("camera frame unavailable")
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
        consecutive_errors = 0
        while self.running:
            grabbed, frame = self.video.read()
            if not grabbed:
                if self.is_video_file:
                    self.video.set(cv2.CAP_PROP_POS_FRAMES, 0)
                    grabbed, frame = self.video.read()
                    if not grabbed:
                        break
                else:
                    consecutive_errors += 1
                    if consecutive_errors >= 20:
                        logger.warning(
                            "camera read failed %d times, stopping capture thread",
                            consecutive_errors,
                        )
                        break
                    sleep(1 / self.fps)
                    continue
            consecutive_errors = 0
            self.frame = frame
            sleep(1 / self.fps)
