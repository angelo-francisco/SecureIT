from tortoise.expressions import Q

from apps.cameras.models import Camera
from apps.cameras.schemas import CameraCreate
from apps.audit.service import log_action
from core.exceptions import NotFound, ValidationError_


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


async def create_camera(profile_id: str, data: CameraCreate) -> Camera:
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
        camera.task = data["task"].upper() if data["task"] else "D"
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


async def get_available_cameras():
    try:
        from cv2_enumerate_cameras import enumerate_cameras
        from asyncio import to_thread

        cameras = await to_thread(lambda: list(enumerate_cameras()))
        cams = []
        registered = set()
        for idx, cam in enumerate(cameras):
            if cam.path not in registered:
                cams.append({
                    "id": idx,
                    "name": cam.name,
                    "path": cam.path,
                    "backend": str(cam.backend),
                    "index": cam.index,
                })
                registered.add(cam.path)
        return cams
    except Exception:
        return []
