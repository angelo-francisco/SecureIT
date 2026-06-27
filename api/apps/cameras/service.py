from tortoise.expressions import Q

from apps.cameras.models import Camera
from apps.cameras.schemas import CameraCreate
from core.exceptions import NotFound, ValidationError_


async def list_cameras(
    user_id: int, search_query: str = "", page: int = 1, per_page: int = 10
) -> list[Camera]:
    query = Camera.filter(user_id=user_id)
    if search_query:
        query = query.filter(Q(location__icontains=search_query))
    offset = (page - 1) * per_page
    return await query.offset(offset).limit(per_page)


async def get_camera(camera_id: int, user_id: int) -> Camera:
    camera = await Camera.get_or_none(id=camera_id, user_id=user_id)
    if not camera:
        raise NotFound("Câmara não encontrada")
    return camera


async def create_camera(user_id: int, data: CameraCreate) -> Camera:
    if data.connection_type == "L" and not data.connection_info:
        raise ValidationError_("Informações da câmara local são necessárias")
    if data.connection_type == "W" and not data.connection_info.get("stream_url"):
        raise ValidationError_("URL de stream é necessária para câmara Wi-Fi")

    camera = await Camera.create(
        user_id=user_id,
        name=data.name,
        location=data.location,
        connection_type=data.connection_type,
        connection_info=data.connection_info,
    )
    return camera


async def update_camera(camera_id: int, user_id: int, data: dict) -> Camera:
    camera = await get_camera(camera_id, user_id)

    if "name" in data:
        camera.name = data["name"]
    if "location" in data:
        camera.location = data["location"]
    if "connection_info" in data:
        info = camera.connection_info or {}
        info.update(data["connection_info"])
        camera.connection_info = info

    await camera.save()
    return camera


async def delete_camera(camera_id: int, user_id: int):
    camera = await Camera.get_or_none(id=camera_id, user_id=user_id)
    if not camera:
        raise NotFound("Câmara não encontrada")
    await camera.delete()


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
