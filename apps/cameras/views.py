from django.contrib import messages
from django.http import JsonResponse, StreamingHttpResponse
from django.shortcuts import get_object_or_404, redirect, render

from .models import Camera, LocalCamera, WifiCamera
from .services import Camera as CameraController
from .services import gen_video
from .utils import get_cameras as func_get_cameras


def cameras(request):
    """
    Lista todas as câmaras cadastradas
    """
    cameras = Camera.objects.all()
    return render(request, "cameras/home.html", {"cameras": cameras})


def new_camera(request):
    """
    Cadastra uma nova câmara
    """
    if request.method == "POST":
        location = request.POST.get("location", "").strip()
        connection_type = request.POST.get("connection_type", "").strip().upper()
        stream_url = request.POST.get("stream_url", "").strip()
        username = request.POST.get("username", "").strip()
        password = request.POST.get("password", "").strip()
        local_camera = request.POST.get("local_camera", "").strip()

        if not location or not connection_type:
            messages.error(request, "Preencha todos os campos, por favor.")
        elif connection_type not in ["L", "W"]:
            messages.error(request, "Só aceitamos câmaras locais ou Wi-1Fi")
        elif connection_type == "L" and not local_camera:
            messages.error(request, "Câmara local não informada")
        elif local_camera not in request.session.get("registered_cameras"):
            messages.error(request, "Câmara não encontrada")
        elif connection_type == "W" and not stream_url:
            messages.error(request, "Informe a url de vídeo da câmara Wi-Fi")
        else:
            camera = Camera.objects.create(
                location=location, connection_type=connection_type
            )

            if connection_type == "W":
                WifiCamera.objects.create(
                    camera=camera,
                    stream_url=stream_url,
                    username=username,
                    password=password,
                )
            else:
                camera_info = None
                for cam in request.session.get("cameras"):
                    if cam["path"] == local_camera:
                        camera_info = cam
                        break
                if not camera_info:
                    camera.delete()
                    messages.error(request, "Dados da câmara indisponíveis.")
                    return render(request, "cameras/new.html")
                LocalCamera.objects.create(camera=camera, info=camera_info)
            messages.success(request, "Câmara registada.")
            return redirect("cameras:home")
    return render(request, "cameras/new.html")


def delete_camera(request, id):
    """
    Elimina uma câmara pelo ID
    """
    camera = get_object_or_404(Camera, id=id)
    camera.delete()
    return redirect("cameras:home")


def view_camera(request, id):
    """
    Mostra os detalhes de uma câmara
    (stream entra aqui depois)
    """
    camera = get_object_or_404(Camera, id=id)
    return render(request, "cameras/view.html", {"camera": camera})


def get_cameras(request):
    cameras, registered = func_get_cameras()
    request.session["cameras"] = cameras
    request.session["registered_cameras"] = list(registered)
    return JsonResponse(cameras, safe=False)


def get_camera_video(request):
    index: str = request.GET.get("index", "")
    try:
        camera = CameraController(index)
        return StreamingHttpResponse(
            gen_video(camera), content_type="multipart/x-mixed-replace;boundary=frame"
        )
    except Exception as error:
        return JsonResponse({"error": str(error)}, status=500)
