import os

from channels.auth import AuthMiddlewareStack
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator
from django.core.asgi import get_asgi_application
from django.urls import path

from apps.panel.consumers import PainelConsumer

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")

django_application = get_asgi_application()

application = ProtocolTypeRouter(
    {
        "http": django_application,
        "websocket": AllowedHostsOriginValidator(
            AuthMiddlewareStack(
                URLRouter(
                    [
                        path("/panel-consumer", PainelConsumer.as_asgi()),
                    ]
                )
            )
        ),
    }
)
