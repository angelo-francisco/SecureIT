from tortoise.expressions import Q

from apps.cameras.models import Camera, LocalCamera, WifiCamera
from apps.cameras.schemas import CameraCreate
from core.exceptions import NotFound, ValidationError_


async def list_cameras(
    user_id: int, search_query: str = "", page: int = 1, per_page: int = 10
) -> list[Camera]:
    query = Camera.filter(user_id=user_id).prefetch_related("localcamera", "wificamera")
    if search_query:
        query = query.filter(Q(location__icontains=search_query))
    offset = (page - 1) * per_page
    return await query.offset(offset).limit(per_page)


async def get_camera(camera_id: int, user_id: int) -> Camera:
    camera = await Camera.get_or_none(id=camera_id, user_id=user_id).prefetch_related(
        "localcamera", "wificamera"
    )
    if not camera:
        raise NotFound("Câmara não encontrada")
    return camera


async def create_camera(
    user_id: int, data: CameraCreate, local_data=None, wifi_data=None
) -> Camera:
    camera = await Camera.create(
        user_id=user_id,
        name=data.name,
        location=data.location,
        connection_type=data.connection_type,
    )

    if data.connection_type == "L":
        if local_data is None:
            await camera.delete()
            raise ValidationError_("Informações da câmara local são necessárias")
        await LocalCamera.create(camera=camera, info=local_data)

    elif data.connection_type == "W":
        if wifi_data is None:
            await camera.delete()
            raise ValidationError_("Informações da câmara Wi-Fi são necessárias")
        if not wifi_data.stream_url.startswith(("http://", "https://", "rtsp://")):
            await camera.delete()
            raise ValidationError_("URL inválida. Use HTTP, HTTPS ou RTSP.")
        await WifiCamera.create(camera=camera, stream_url=wifi_data.stream_url)

    return await Camera.get(id=camera.id).prefetch_related("localcamera", "wificamera")


async def update_camera(camera_id: int, user_id: int, data: dict) -> Camera:
    camera = await get_camera(camera_id, user_id)

    if "name" in data:
        camera.name = data["name"]
    if "location" in data:
        camera.location = data["location"]
    if "stream_url" in data and camera.connection_type == "W":
        wifi = await camera.wificamera
        if wifi:
            wifi.stream_url = data["stream_url"]
            await wifi.save()

    await camera.save()
    return await Camera.get(id=camera.id).prefetch_related("localcamera", "wificamera")


async def delete_camera(camera_id: int, user_id: int):
    camera = await Camera.get_or_none(id=camera_id, user_id=user_id)
    if not camera:
        raise NotFound("Câmara não encontrada")
    await camera.delete()


async def get_available_cameras():
    from cv2_enumerate_cameras import enumerate_cameras

    cams = []
    registered = set()
    for idx, cam in enumerate(enumerate_cameras()):
        if cam.path not in registered:
            cams.append({
                "id": idx,
                "name": cam.name,
                "path": cam.path,
                "backend": cam.backend,
                "index": cam.index,
            })
            registered.add(cam.path)
    return cams
