from django.contrib import messages
from django.core.exceptions import ValidationError
from django.core.paginator import Paginator
from django.http import JsonResponse
from django.shortcuts import get_object_or_404, redirect, render
from django.urls import reverse

from .models import Camera, LocalCamera, WifiCamera
from .utils import (
    create_camera,
    create_local_camera,
    create_wifi_camera,
    valid_connection_type,
)
from .utils import get_cameras as func_get_cameras
from core.utils import invalidate_cache


def cameras(request):
    """
    Lista todas as câmaras cadastradas
    """
    context = {}
    cameras = Camera.objects.select_related("localcamera", "wificamera").filter(user=request.user)  # type: ignore
    search_query = request.GET.get("search_query", "").strip()
    page_number = request.GET.get("page", "")

    if search_query:
        cameras = cameras.filter(location__icontains=search_query)

    paginator = Paginator(cameras, 10)
    context["cameras"] = paginator.get_page(page_number)
    return render(request, "cameras/home.html", context)


def new_camera(request):
    """
    Cadastra uma nova câmara
    """
    cameras, _ = func_get_cameras()
    context = {"cameras": cameras}
    camera = None
    if request.method != "POST":
        return render(request, "cameras/new.html", context)
    try:
        user = request.user
        camera = create_camera(
            user=user,
            name=request.POST.get("name", "").strip(),
            location=request.POST.get("location", "").strip(),
            connection_type=request.POST.get("connection_type", "").strip().upper(),
        )

        match camera.connection_type:
            case "L":
                create_local_camera(
                    camera_id=camera.pk,
                    camera_path=request.POST.get("local_camera", "").strip(),
                    cameras_list=cameras,
                )
            case "W":
                create_wifi_camera(
                    camera_id=camera.pk,
                    stream_url=request.POST.get("stream_url", "").strip(),
                )
        invalidate_cache(f"user_{user.id}_cameras")
        messages.success(request, "Câmara registada.")
        return redirect("cameras:home")
    except Exception as error:
        print(error)
        if camera:
            camera.delete()
        msg = (
            error.message  # type: ignore
            if getattr(error, "message", False)
            else "Erro ao registar câmara."
        )
        messages.error(request, msg)
        return render(request, "cameras/new.html", context)


def delete_camera(request, id):
    """
    Elimina uma câmara pelo ID
    """
    user = request.user
    camera: Camera = get_object_or_404(Camera, id=id)
    if camera.user == user:
        invalidate_cache(f"user_{user.id}_cameras")
        camera.delete()
    else:
        messages.error(request, "Esta câmara não é sua")
    return redirect("cameras:home")


def view_camera(request, id):
    """
    Mostra os detalhes de uma câmara
    """
    camera = get_object_or_404(
        Camera.objects.select_related("localcamera", "wificamera"),
        id=id,
        user=request.user,
    )
    if not camera:
        messages.error(request, "Esta câmara não é sua")
        return redirect("cameras:home")
    return render(request, "cameras/view.html", {"camera": camera})


def edit_camera(request, id):
    user = request.user
    camera = get_object_or_404(Camera, id=id)
    if not (camera.user == user):
        messages.error(request, "Esta câmara não é sua")
        return redirect("cameras:home")

    if request.method == "POST":
        try:
            name = request.POST.get("name", "").strip()
            location = request.POST.get("location", "").strip()
            connection_type = valid_connection_type(
                request.POST.get("connection_type", "").strip().upper()
            )

            if not name or not location:
                raise ValidationError("Informe o nome e a localização")

            camera.name = name
            camera.location = location

            if camera.connection_type != connection_type:
                if camera.connection_type == "L":
                    camera.localcamera.delete()
                else:
                    camera.wificamera.delete()

                camera.connection_type = connection_type

            camera.save()

            match camera.connection_type:
                case "L":
                    cameras_list, _ = func_get_cameras()
                    camera_path = request.POST.get("local_camera", "").strip()

                    if not camera_path:
                        raise ValidationError("Informe a câmara local, por favor.")

                    camera_info = None
                    for cam in cameras_list:
                        if cam["path"] == camera_path:
                            camera_info = cam
                            break

                    if not camera_info:
                        raise ValidationError("Dados da câmara indisponíveis.")

                    LocalCamera.objects.update_or_create(  # type: ignore
                        camera=camera, defaults={"info": camera_info}
                    )
                case "W":
                    stream_url = request.POST.get("stream_url", "").strip()
                    if not stream_url:
                        raise ValidationError("URL de transmissão não informada")

                    WifiCamera.objects.update_or_create(  # type: ignore
                        camera=camera, defaults={"stream_url": stream_url}
                    )
            invalidate_cache(f"user_{user.id}_cameras")
            messages.success(request, "Dados editados com sucesso.")
            return redirect(reverse("cameras:view", args=[camera.pk]))
        except Exception as error:
            msg = (
                error.message  # type: ignore
                if getattr(error, "message", False)
                else "Erro ao registar câmara."
            )
            messages.error(request, msg)
    return render(request, "cameras/edit.html", {"camera": camera})


def get_cameras(request):
    cameras = []
    user = request.user
    for camera in func_get_cameras()[0]:
        if not LocalCamera.objects.filter(camera__user_id=user.id, info__path=camera["path"]).exists():
            cameras.append(camera)
    return JsonResponse(cameras, safe=False)
