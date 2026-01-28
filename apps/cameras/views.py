from django.contrib import messages
from django.http import JsonResponse
from django.shortcuts import get_object_or_404, redirect, render

from .models import Camera, LocalCamera, WifiCamera
from .utils import create_camera, create_local_camera, create_wifi_camera
from .utils import get_cameras as func_get_cameras
from itertools import chain

def cameras(request):
    """
    Lista todas as câmaras cadastradas
    """
    local_cameras = LocalCamera.objects.select_related("camera").filter(
        camera__user=request.user
    )
    wifi_cameras = WifiCamera.objects.select_related("camera").filter(
        camera__user=request.user
    )

    cameras = list(chain(local_cameras, wifi_cameras))
    return render(request, "cameras/home.html", {"cameras": cameras})


def new_camera(request):
    """
    Cadastra uma nova câmara
    """
    cameras, _ = func_get_cameras()
    context = {"cameras": cameras}
    if request.method != "POST":
        return render(request, "cameras/new.html", context)
    try:
        camera = create_camera(
            user=request.user,
            location=request.POST.get("location", "").strip(),
            connection_type=request.POST.get("connection_type", "").strip().upper(),
        )

        match camera.connection_type:
            case "L":
                create_local_camera(
                    camera_id=camera.id,
                    camera_path=request.POST.get("local_camera", "").strip(),
                    cameras_list=cameras,
                )
            case "W":
                create_wifi_camera(
                    camera_id=camera.id,
                    stream_url=request.POST.get("stream_url", "").strip(),
                    username=request.POST.get("username", "").strip(),
                    password=request.POST.get("password", "").strip(),
                )

        messages.success(request, "Câmara registada.")
        return redirect("cameras:home")
    except Exception as error:
        print(error)
        if camera:
            camera.delete()
        msg = (
            error.message
            if getattr(error, "message", False)
            else "Erro ao registar câmara."
        )
        messages.error(request, msg)
        return render(request, "cameras/new.html", context)


def delete_camera(request, id):
    """
    Elimina uma câmara pelo ID
    """
    camera: Camera = get_object_or_404(Camera, id=id)
    if camera.user == request.user:
        camera.delete()
    else:
        messages.error(request, "Esta câmara não é sua")
    return redirect("cameras:home")


def view_camera(request, id):
    """
    Mostra os detalhes de uma câmara
    (stream entra aqui depois)
    """
    camera = get_object_or_404(Camera, id=id)
    if camera.user == request.user:
        return render(request, "cameras/view.html", {"camera": camera})
    else:
        messages.error(request, "Esta câmara não é sua")
        return redirect("cameras:home")


def get_cameras(request):
    cameras = func_get_cameras()[0]
    return JsonResponse(cameras, safe=False)
