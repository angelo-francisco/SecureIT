from platform import system

from django.shortcuts import render

from apps.cameras.models import Camera


def panel(request):
    cameras = Camera.objects.filter(user=request.user).all()
    for camera in cameras:
        print(getattr(camera, "local_camera_set", None))
    return render(
        request, "panel/panel.html", {"cameras": cameras, "platform": system()}
    )
