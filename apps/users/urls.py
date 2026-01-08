from django.urls import path
from .views import (
    signup,
    login_page,
    signup_api,
    login_api,
    dashboard,
    logout_view
)

app_name = "users"

urlpatterns = [
    # páginas
    path("signup/", signup, name="signup"),
    path("login/", login_page, name="login"),

    # API
    path("api/signup/", signup_api),
    path("api/login/", login_api),

    # sessão
    path("dashboard/", dashboard),
    path("logout/", logout_view),
]

