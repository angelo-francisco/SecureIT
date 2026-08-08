from unittest.mock import patch

from apps.cameras.models import Camera, _camera_device_id
from apps.cameras.paths import resolve_video_path


def test_camera_device_id_variants():
    assert _camera_device_id(None) is None
    assert _camera_device_id("") is None
    assert _camera_device_id(True) is None
    assert _camera_device_id(False) is None
    assert _camera_device_id("0") == 0
    assert _camera_device_id(" 2 ") == 2
    assert _camera_device_id(3) == 3
    assert _camera_device_id(-1) is None
    assert _camera_device_id("not-a-number") is None


def test_video_source_without_id_does_not_raise():
    cam = Camera(connection_type="L", connection_info={"path": ""})
    assert cam.video_source() is None


def test_video_source_with_null_id():
    cam = Camera(connection_type="L", connection_info={"path": "", "id": None})
    assert cam.video_source() is None


def test_video_source_with_digit_string_id():
    cam = Camera(connection_type="L", connection_info={"path": "", "id": "0"})
    assert cam.video_source() == 0


def test_video_source_with_int_id():
    cam = Camera(connection_type="L", connection_info={"path": "", "id": 2})
    assert cam.video_source() == 2


def test_video_source_video_file_returns_path():
    cam = Camera(connection_type="L", connection_info={"path": "/tmp/demo.mp4"})
    assert cam.video_source() == "/tmp/demo.mp4"


def test_resolve_video_path_unmapped_without_env():
    with patch("apps.cameras.paths.settings.HOST_VIDEO_DIR", ""):
        assert resolve_video_path("/home/user/videos/demo.mp4") == "/home/user/videos/demo.mp4"


def test_resolve_video_path_maps_host_dir_to_container():
    with patch("apps.cameras.paths.settings.HOST_VIDEO_DIR", "/home/kiluzx/Downloads"):
        resolved = resolve_video_path(
            "/home/kiluzx/Downloads/gettyimages-1382583689-640_adpp.mp4"
        )
        assert resolved == "/downloads/gettyimages-1382583689-640_adpp.mp4"


def test_resolve_video_path_ignores_unrelated_paths():
    with patch("apps.cameras.paths.settings.HOST_VIDEO_DIR", "/home/kiluzx/Downloads"):
        assert resolve_video_path("/opt/videos/demo.mp4") == "/opt/videos/demo.mp4"


def test_video_source_video_file_maps_host_path():
    with patch("apps.cameras.paths.settings.HOST_VIDEO_DIR", "/home/kiluzx/Downloads"):
        cam = Camera(
            connection_type="L",
            connection_info={"path": "/home/kiluzx/Downloads/demo.mp4"},
        )
        assert cam.video_source() == "/downloads/demo.mp4"
