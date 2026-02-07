from cv2_enumerate_cameras import enumerate_cameras
from django.core.exceptions import ValidationError

from .models import Camera, LocalCamera, WifiCamera


def create_camera(user, name, location, connection_type):
    if not location or not connection_type or not name:
        raise ValidationError("Preencha todos os campos, por favor.")
    if connection_type not in ["L", "W"]:
        raise ValidationError("Só aceitamos câmaras locais ou Wi-Fi")

    camera = Camera.objects.create(
        user=user, name=name, location=location, connection_type=connection_type
    )

    return camera


def create_wifi_camera(camera_id, stream_url, username, password):
    if not stream_url:
        raise ValidationError("Informe a url de video da câmara")
    return WifiCamera.objects.create(  # type: ignore
        camera=camera_id,
        stream_url=stream_url,
        username=username,
        password=password,
    )


def create_local_camera(camera_id, camera_path, cameras_list):
    if not camera_path:
        raise ValidationError("Informe a câmara local, por favor.")

    camera_info = None
    for cam in cameras_list:
        if cam["path"] == camera_path:
            camera_info = cam
            break

    if not camera_info:
        raise ValidationError("Dados da câmara indisponíveis.")

    return LocalCamera.objects.create(camera_id=camera_id, info=camera_info)  # type: ignore


def get_cameras():
    cams = []
    registered = set()
    for idx, cam in enumerate(enumerate_cameras()):
        if cam.path not in registered:
            cams.append(
                {
                    "id": idx,
                    "name": cam.name,
                    "path": cam.path,
                    "backend": cam.backend,
                    "index": cam.index,
                }
            )
            registered.add(cam.path)
    return cams, registered


def valid_connection_type(connection_type):
    if not connection_type:
        raise ValidationError("Informe o tipo de conexão")

    if connection_type not in ["L", "W"]:
        raise ValidationError("Tipo de conexão desconhecido")
    return connection_type
