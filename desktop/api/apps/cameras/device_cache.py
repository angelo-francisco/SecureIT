"""Cached enumeration of local capture devices.

Enumerating and verifying cameras with OpenCV is blocking and can take
several seconds, so results are cached on disk
(``~/.secureit/camera_cache.json``) with a short TTL. The cache also lets
saved cameras re-resolve their capture id after a reboot, since device
enumeration order can change on Windows.
"""

import json
import time
from pathlib import Path

CACHE_TTL_SECONDS = 300
CACHE_FILENAME = "camera_cache.json"


def camera_cache_path() -> Path:
    return Path.home() / ".secureit" / CACHE_FILENAME


def load_camera_cache() -> list[dict] | None:
    """Return cached cameras if the cache is fresh, otherwise None."""
    try:
        raw = json.loads(camera_cache_path().read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return None
    if time.time() - raw.get("cached_at", 0) > CACHE_TTL_SECONDS:
        return None
    return raw.get("cameras")


def save_camera_cache(cameras: list[dict]) -> None:
    try:
        path = camera_cache_path()
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(
            json.dumps(
                {"cached_at": time.time(), "cameras": cameras},
                ensure_ascii=False,
            ),
            encoding="utf-8",
        )
    except OSError:
        pass


def resolve_windows_device_id(path: str) -> int | None:
    """Map a saved camera ``path`` to its current combined capture id.

    Combined ids encode the backend (``backend + index``) and are stable
    across re-enumeration as long as the device path does not change.
    """
    if not path:
        return None
    for cam in load_camera_cache() or []:
        if cam.get("path") == path:
            device_id = cam.get("id")
            if isinstance(device_id, int):
                return device_id
    return None
