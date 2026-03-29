from django.contrib import messages
from django.core.cache import cache
from django.core.exceptions import ValidationError
from django.shortcuts import get_object_or_404, render
from django.utils.dateparse import parse_time

from apps.cameras.models import Camera
from apps.notifications.models import Notification
from apps.panel.models import Configuration
from apps.people.utils import update_instace


def panel(request):
    user = request.user
    cameras = cache.get_or_set(
        f"user_{user.id}_cameras",
        lambda: Camera.objects.select_related("localcamera", "wificamera").filter(
            user=user
        ),
    )
    notifications_count = Notification.objects.filter(  # type: ignore
        user=request.user, readed=False, deleted=False
    ).count()
    if (
        not user.settings.monitoring_end_time
        or not user.settings.monitoring_start_time
    ):
        messages.info(request, r'Defina os horários de monitoramento nas configurações')
    return render(
        request,
        "panel/panel.html",
        {"cameras": cameras, "notifications_count": notifications_count},
    )


def settings(request):
    settings = get_object_or_404(Configuration, user=request.user)
    if request.method == "POST":
        fps = request.POST.get("fps", "")
        mst = request.POST.get("mst")
        met = request.POST.get("met")

        try:
            if fps and not fps.isdigit():
                raise ValidationError("FPS inválido")

            fps = int(fps)
            if fps < 1:
                raise ValidationError("FPS deve ser maior que 1")

            if mst and not settings.is_valid_time(mst):
                raise ValidationError("Horário de início inválido")

            if met and not settings.is_valid_time(met):
                raise ValidationError("Horário de término inválido")

            update_instace(
                settings,
                {
                    "fps": fps,
                    "monitoring_end_time": parse_time(met),
                    "monitoring_start_time": parse_time(mst),
                },
            )

            messages.success(request, "As suas alterações foram salvas")
        except Exception as error:
            msg = (
                error.message  # type: ignore
                if getattr(error, "message", False)
                else "Erro ao salvar"
            )
            messages.error(request, msg)
    return render(request, "panel/settings.html", {"settings": settings})
