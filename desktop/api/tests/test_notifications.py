import asyncio
from unittest.mock import AsyncMock, MagicMock, patch

import numpy as np
import pytest

from apps.notifications.service import cleanup_orphan_photos
from core.config import settings
from websocket.helpers import create_notification

JPEG_MAGIC = b"\xff\xd8"


@pytest.fixture
def media_tmp(tmp_path):
    d = tmp_path / "media"
    d.mkdir()
    old = settings.MEDIA_ROOT
    settings.MEDIA_ROOT = d
    yield d
    settings.MEDIA_ROOT = old


def test_cleanup_removes_broken_images(media_tmp):
    frames = media_tmp / "notifications_frames"
    frames.mkdir()
    broken = frames / "broken-1.jpg"
    broken.write_bytes(b"\xa9\xad\xa8 raw numpy buffer")
    valid = frames / "valid-1.jpg"
    valid.write_bytes(JPEG_MAGIC + b"fake jpeg body")

    FakeNotification = MagicMock()
    filtered = FakeNotification.filter.return_value
    filtered.update = AsyncMock(return_value=None)

    with patch("apps.notifications.service.Notification", FakeNotification):
        asyncio.run(cleanup_orphan_photos())

    assert not broken.exists()
    assert valid.exists()
    FakeNotification.filter.assert_called_once_with(photo__in=["notifications_frames/broken-1.jpg"])
    filtered.update.assert_called_once_with(photo=None)


def test_cleanup_ignores_missing_directory(tmp_path):
    old = settings.MEDIA_ROOT
    settings.MEDIA_ROOT = tmp_path / "nonexistent"
    try:
        asyncio.run(cleanup_orphan_photos())
    finally:
        settings.MEDIA_ROOT = old


def test_create_notification_writes_valid_jpeg(media_tmp):
    frame = np.zeros((240, 320, 3), dtype=np.uint8)
    frame[:] = (120, 60, 30)

    FakeNotification = AsyncMock()
    with patch("websocket.helpers.Notification", FakeNotification):
        asyncio.run(
            create_notification(
                profile_id="notif-test-user",
                camera_id=None,
                title="Alerta",
                description="teste jpeg",
                level="E",
                frame=frame,
            )
        )

    saved = list((media_tmp / "notifications_frames").glob("*.jpg"))
    assert len(saved) == 1
    assert saved[0].read_bytes()[:2] == JPEG_MAGIC
    FakeNotification.create.assert_called_once()
    assert FakeNotification.create.call_args.kwargs["photo"].startswith("notifications_frames/")
