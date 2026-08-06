from apps.cameras.models import Camera, _camera_device_id


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
