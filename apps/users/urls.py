from django.urls import path

from .views import lock, login, logout, pin, signup

app_name = "users"

urlpatterns = [
    path("signup/", signup, name="signup"),
    path("login/", login, name="login"),
    path("logout/", logout, name="logout"),
    path("pin/", pin, name="pin"),
    path("lock/", lock, name="lock"),
]
