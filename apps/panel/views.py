from django.shortcuts import render

from apps.cameras.models import Camera
from apps.notifications.models import Notification


def panel(request):
    cameras = Camera.objects.filter(user=request.user)  # type: ignore
    notifications_count = Notification.objects.filter(  # type: ignore
        user=request.user, readed=False, deleted=False
    ).count()
    return render(
        request,
        "panel/panel.html",
        {"cameras": cameras, "notifications_count": notifications_count},
    )
