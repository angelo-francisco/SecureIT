import cv2
from asyncio import to_thread
from platform import system

from cv2_enumerate_cameras import cameras_generator, supported_backends
from tortoise.expressions import Q

from apps.cameras.device_cache import load_camera_cache, save_camera_cache
from apps.cameras.models import Camera
from apps.cameras.schemas import CameraCreate
from apps.audit.service import log_action
from apps.control.models import Profile
from apps.license.models import License
from core.exceptions import NotFound, ValidationError_
from websocket.registry import close_camera_connections

SYSTEM = system()


async def list_cameras(
    profile_id: str, search_query: str = "", page: int = 1, per_page: int = 10
) -> list[Camera]:
    query = Camera.filter(profile_id=profile_id)
    if search_query:
        query = query.filter(Q(location__icontains=search_query))
    offset = (page - 1) * per_page
    return await query.offset(offset).limit(per_page)


async def get_camera(camera_id: int, profile_id: str) -> Camera:
    camera = await Camera.get_or_none(id=camera_id, profile_id=profile_id)
    if not camera:
        raise NotFound("Câmara não encontrada")
    return camera


TASK_FEATURE_MAP: dict[str, list[str]] = {
    "D": [],
    "FR": ["face_recognition"],
    "BA": ["analise_comportamental", "anlise_comportamental"],
}


async def _check_feature_access(profile_id: str, task: str) -> None:
    required_features = TASK_FEATURE_MAP.get(task.upper(), [])
    if not required_features:
        return

    profile = await Profile.get_or_none(profile_id=profile_id)
    if not profile:
        raise ValidationError_("Perfil não encontrado")

    license_obj = await License.filter(user_id=profile.user_id, status="ACTIVE").first()
    if not license_obj:
        raise ValidationError_(
            "Licença não encontrada. Ative uma licença para usar esta funcionalidade."
        )

    features = license_obj.features or []
    if not any(f in features for f in required_features):
        raise ValidationError_("A sua licença não inclui esta funcionalidade.")


async def create_camera(profile_id: str, data: CameraCreate) -> Camera:
    await _check_feature_access(profile_id, data.task)

    if data.connection_type == "L" and not data.connection_info:
        raise ValidationError_("Informações da câmara local são necessárias")
    if data.connection_type == "W" and not data.connection_info.get("stream_url"):
        raise ValidationError_("URL de stream é necessária para câmara Wi-Fi")

    camera = await Camera.create(
        profile_id=profile_id,
        name=data.name,
        location=data.location,
        connection_type=data.connection_type,
        connection_info=data.connection_info,
        face_recognition=data.face_recognition,
        task=data.task.upper() if data.task else "D",
    )
    await log_action("create", "camera", camera.id)
    return camera


async def update_camera(camera_id: int, profile_id: str, data: dict) -> Camera:
    camera = await get_camera(camera_id, profile_id)

    if "name" in data:
        camera.name = data["name"]
    if "location" in data:
        camera.location = data["location"]
    if "connection_info" in data:
        info = camera.connection_info or {}
        info.update(data["connection_info"])
        camera.connection_info = info
    if "face_recognition" in data:
        camera.face_recognition = data["face_recognition"]
    if "task" in data:
        new_task = data["task"].upper() if data["task"] else "D"
        await _check_feature_access(profile_id, new_task)
        camera.task = new_task
        if camera.task == "FR":
            camera.face_recognition = True
        elif camera.task != "FR":
            camera.face_recognition = False

    await camera.save()
    await log_action("update", "camera", camera.id)
    return camera


async def delete_camera(camera_id: int, profile_id: str):
    camera = await Camera.get_or_none(id=camera_id, profile_id=profile_id)
    if not camera:
        raise NotFound("Câmara não encontrada")
    await camera.delete()
    await log_action("delete", "camera", camera_id)
    await close_camera_connections(camera_id)


def _camera_opens(backend: int, source) -> bool:
    """Open a capture device and grab one frame to confirm it is usable."""
    try:
        cap = cv2.VideoCapture(source, backend)
        if cap is None:
            return False
        try:
            if not cap.isOpened():
                return False
            grabbed, _frame = cap.read()
            return bool(grabbed)
        finally:
            cap.release()
    except Exception:
        return False


def _discover_cameras() -> list[dict]:
    cameras: list[dict] = []
    seen: set[str] = set()
    for backend in supported_backends:
        for info in cameras_generator(backend):
            key = info.path or f"{backend}:{info.index}"
            if key in seen:
                continue
            seen.add(key)

            if SYSTEM == "Windows":
                usable = _camera_opens(backend, info.index)
            elif info.path:
                usable = _camera_opens(0, info.path)
            else:
                usable = _camera_opens(backend, info.index)

            cameras.append(
                {
                    "id": backend + info.index,
                    "name": info.name,
                    "path": info.path or "",
                    "backend": backend,
                    "index": info.index,
                    "vid": info.vid,
                    "pid": info.pid,
                    "usable": usable,
                }
            )
    cameras.sort(key=lambda c: (not c["usable"], c["path"] or ""))
    return cameras


async def get_available_cameras(refresh: bool = False) -> list[dict]:
    """List verified local capture devices, using a short-lived on-disk cache.

    ``refresh=True`` forces re-enumeration (verification grabs one frame per
    device) so dead or busy cameras can be detected by the user.
    """
    if not refresh:
        cached = load_camera_cache()
        if cached is not None:
            return [c for c in cached if c.get("usable")]
    cameras = await to_thread(_discover_cameras)
    save_camera_cache(cameras)
    return [c for c in cameras if c.get("usable")]
