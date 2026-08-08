import logging
import threading

import av
import cv2

logger = logging.getLogger(__name__)


class AVReader:
    """Video-file reader backed by FFmpeg (via PyAV) with a VideoCapture-like API.

    OpenCV's bundled FFmpeg build cannot decode some codecs (notably AV1), so
    CameraService falls back to this reader for video files. It mirrors the
    small subset of ``cv2.VideoCapture`` used by CameraService and loops the
    file, matching the existing behaviour for video sources.
    """

    def __init__(self, path, loop=True):
        self.loop = loop
        self._lock = threading.Lock()
        self._container = None
        self._stream = None
        self._frames = None
        self.fps = 0.0
        self.total_frames = 0

        try:
            container = av.open(path)
            stream = container.streams.video[0]
        except Exception as exc:
            raise RuntimeError(f"Erro ao abrir vídeo via PyAV: {exc}") from exc

        self._container = container
        self._stream = stream
        self.fps = float(
            stream.average_rate
            or stream.guessed_rate
            or stream.base_rate
            or 0
        )
        if self.fps <= 0:
            self.fps = 25.0
        self.total_frames = int(stream.frames or 0)
        self._frames = self._container.decode(self._stream)
        logger.info(
            "AVReader opened path=%s fps=%.2f total_frames=%s",
            path,
            self.fps,
            self.total_frames,
        )

    def isOpened(self):
        return self._container is not None

    def release(self):
        with self._lock:
            if self._container is not None:
                try:
                    self._container.close()
                except Exception:
                    pass
                self._container = None
                self._frames = None

    def _restart(self):
        try:
            self._container.seek(0)
            self._frames = self._container.decode(self._stream)
        except Exception:
            self._frames = None

    def read(self):
        with self._lock:
            if self._container is None or self._frames is None:
                return False, None
            for _ in range(16):
                try:
                    frame = next(self._frames)
                except StopIteration:
                    if self.loop:
                        self._restart()
                        continue
                    return False, None
                except Exception:
                    continue
                try:
                    return True, frame.to_ndarray(format="bgr24")
                except Exception:
                    continue
            return False, None

    def get(self, prop):
        if prop == cv2.CAP_PROP_FPS:
            return self.fps
        if prop == cv2.CAP_PROP_FRAME_COUNT:
            return float(self.total_frames)
        return 0.0

    def set(self, prop, value):
        if prop == cv2.CAP_PROP_POS_FRAMES and value == 0:
            with self._lock:
                self._restart()
            return True
        return False
