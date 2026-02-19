from django.urls import path

from .views import notifications, delete_notification

app_name = "notifications"

urlpatterns = [
    path("", notifications, name="home"),
    path("<int:notification_id>/del", delete_notification, name="delete"),
]
