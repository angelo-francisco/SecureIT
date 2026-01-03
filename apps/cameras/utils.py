from cv2_enumerate_cameras import enumerate_cameras


def get_cameras() -> tuple[list[dict[str, str | int]], set[str]]:
    """
    Mapeia todas as câmaras disponíveis no computador
    """
    cams = []
    registered = set()
    for cam in enumerate_cameras():
        if cam.path not in registered:
            cams.append(
                {
                    "name": cam.name,
                    "path": cam.path,
                    "backend": cam.backend,
                    "index": cam.index,
                }
            )
            registered.add(cam.path)
    return cams, registered
