from core.config import settings


def resolve_video_path(path: str | None) -> str | None:
    """Map a host-side demo video path to the path seen inside this process.

    During development the API runs in Docker, where the host ``Downloads``
    folder is mounted at ``/downloads`` (see docker-compose.yml). A path typed
    from the host therefore does not exist inside the container; rewrite the
    configured host prefix to the container mount so OpenCV can open it. When
    not running under Docker (``HOST_VIDEO_DIR`` unset) the path is returned
    unchanged.
    """
    if not path or not settings.HOST_VIDEO_DIR:
        return path
    host_dir = settings.HOST_VIDEO_DIR
    if path == host_dir or path.startswith((host_dir + "/", host_dir + "\\")):
        relative = path[len(host_dir) :].lstrip("/\\")
        return f"{settings.VIDEO_DIR.rstrip('/')}/{relative}"
    return path
