from django.conf import settings
from django.conf.urls.static import static
from django.contrib.staticfiles.urls import staticfiles_urlpatterns
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("", include("apps.panel.urls")),
    path("users/", include("apps.users.urls", namespace="users")),
    path("cameras/", include("apps.cameras.urls", namespace="cameras")),
    path(
        "notifications/", include("apps.notifications.urls", namespace="notifications")
    ),
    path("people/", include("apps.people.urls", namespace="people")),
    path("admin/", admin.site.urls),
    path("__reload__/", include("django_browser_reload.urls")),
]
urlpatterns += staticfiles_urlpatterns() + static(
    settings.MEDIA_URL, document_root=settings.MEDIA_ROOT
)
