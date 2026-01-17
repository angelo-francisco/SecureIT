from django.urls import path

from .views import notifications

app_name = "notifications"


urlpatterns = [path("notifications/", notifications, name="home")]
