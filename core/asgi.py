import os

from django.core.asgi import get_asgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")

# loads django first
django_application = get_asgi_application()

from channels.auth import AuthMiddlewareStack  # NOQA
from channels.routing import ProtocolTypeRouter, URLRouter  # NOQA
from channels.security.websocket import AllowedHostsOriginValidator  # NOQA
from django.urls import path  # NOQA

from apps.cameras.consumers import CameraConsumer  # NOQA

application = ProtocolTypeRouter(
    {
        "http": django_application,
        "websocket": AllowedHostsOriginValidator(
            AuthMiddlewareStack(
                URLRouter(
                    [
                        path(
                            "ws/camera/<int:camera_id>/",
                            CameraConsumer.as_asgi(),
                        ),
                    ]
                )
            )
        ),
    }
)
