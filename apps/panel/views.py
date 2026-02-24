from django.core.exceptions import ValidationError
import orjson as json  # type: ignore
from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt

from apps.cameras.models import Camera
from apps.notifications.models import Notification
from apps.people.utils import update_instace


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


@csrf_exempt
def save_settings(request):
    if request.method == "POST":
        configuration = request.user.settings
        data = json.loads(request.body)

        try:
            fps = int(data.get("fps"))
            if fps < 1:
                raise ValidationError("FPS inválido")
            update_instace(configuration, data)
        except Exception as error:
            print(error)
            msg = (
                error.message  # type: ignore
                if getattr(error, "message", False)
                else "Erro ao salvar"
            )
            return JsonResponse(
                {
                    "error": msg,
                    "fps": configuration.fps,
                    "monitoring_start_time": configuration.monitoring_start_time,
                    "monitoring_end_time": configuration.monitoring_end_time,
                },
                status=400,
            )
        return JsonResponse(
            {
                "fps": configuration.fps,
                "monitoring_start_time": configuration.monitoring_start_time,
                "monitoring_end_time": configuration.monitoring_end_time,
            }
        )
