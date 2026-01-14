from django.urls import path
from .views import signup, login, logout, pin

app_name = "users"

urlpatterns = [
    path("signup/", signup, name="signup"),
    path("login/", login, name="login"),
    path("logout/", logout, name="logout"),
    path("pin/", pin, name="pin"),
]

