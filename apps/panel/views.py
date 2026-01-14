from platform import system

from django.shortcuts import render

from apps.cameras.models import Camera


def panel(request):
    cameras = Camera.objects.all()
    return render(
        request, "panel/panel.html", {"cameras": cameras, "platform": system()}
    )
