from platform import system

from django.shortcuts import render

from apps.cameras.models import Camera


def panel(request):
    cameras = Camera.objects.filter(user=request.user).all()
    return render(
        request, "panel/panel.html", {"cameras": cameras, "platform": system()}
    )
