import time

import av
import cv2
import numpy as np
import pytest

from services.av_reader import AVReader
from services.camera import CameraService

WIDTH, HEIGHT, FPS, SECONDS = 160, 90, 10, 1


def _make_av1(path) -> None:
    container = av.open(str(path), mode="w")
    stream = container.add_stream("libaom-av1", rate=FPS)
    stream.width = WIDTH
    stream.height = HEIGHT
    stream.pix_fmt = "yuv420p"
    stream.options = {"cpu-used": "8", "deadline": "realtime"}
    for i in range(FPS * SECONDS):
        img = np.full((HEIGHT, WIDTH, 3), (i * 20) % 255, dtype=np.uint8)
        frame = av.VideoFrame.from_ndarray(img, format="bgr24")
        frame = frame.reformat(WIDTH, HEIGHT, format="yuv420p")
        for packet in stream.encode(frame):
            container.mux(packet)
    for packet in stream.encode():
        container.mux(packet)
    container.close()


@pytest.fixture
def av1_path(tmp_path):
    path = tmp_path / "av1_sample.mp4"
    _make_av1(path)
    return path


def test_av_reader_decodes_av1(av1_path):
    reader = AVReader(str(av1_path))
    assert reader.isOpened()
    assert reader.fps == pytest.approx(FPS)
    assert reader.total_frames == FPS * SECONDS

    ok, frame = reader.read()
    assert ok
    assert frame.shape == (HEIGHT, WIDTH, 3)
    assert frame.dtype == np.uint8

    n = 0
    while n < FPS * SECONDS * 3 and reader.read()[0]:
        n += 1
    assert n == FPS * SECONDS * 3

    assert reader.get(cv2.CAP_PROP_FPS) == pytest.approx(FPS)
    assert reader.get(cv2.CAP_PROP_FRAME_COUNT) == FPS * SECONDS

    assert reader.set(cv2.CAP_PROP_POS_FRAMES, 0)
    ok, frame = reader.read()
    assert ok and frame is not None

    reader.release()
    assert not reader.isOpened()


def test_av_reader_no_loop_stops_at_eof(av1_path):
    reader = AVReader(str(av1_path), loop=False)
    count = 0
    while reader.read()[0]:
        count += 1
    assert count == FPS * SECONDS
    reader.release()


def test_camera_service_falls_back_for_av1(av1_path):
    cam = CameraService(str(av1_path), fps=15, allow_draw=False)
    try:
        assert cam.is_video_file
        assert cam.grabbed
        assert cam.frame is not None
        assert cam.frame.shape == (HEIGHT, WIDTH, 3)
        time.sleep(0.4)
        assert cam.frame is not None
        jpeg, people = cam.get_frame(detect=False)
        assert len(jpeg) > 0
        assert people == 0
    finally:
        cam.stop()
