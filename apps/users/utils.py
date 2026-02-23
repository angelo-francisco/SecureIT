from functools import wraps

from django.contrib.auth.decorators import login_not_required
from django.shortcuts import redirect
from django.urls import resolve


def pin_middleware(get_response):
    def middleware(request):
        setattr(request, "pin_verified", True)
        path_info = request.path_info

        if path_info.startswith('/users/signup') or path_info.startswith('/users/login'):
            setattr(request, "need_pin_modal", False)

        resolver = resolve(path_info)
        view = resolver.func

        if (
            getattr(view, "pin_required", True)
            and not request.COOKIES.get("pin_verified", False)
            and request.user.is_authenticated
        ):
            setattr(request, "pin_verified", False)
        response = get_response(request)
        return response

    return middleware


def pin_not_required(view_func):
    view_func.pin_required = False

    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        if request.COOKIES.get("pin_verified", False):
            return redirect("panel:home")
        return view_func(request, *args, **kwargs)

    return wrapper


def without_login(view_func):
    view_func = login_not_required(view_func)

    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        if request.user.is_authenticated:
            return redirect(
                "panel:home"
                #if request.COOKIES.get("pin_verified", False)
               # else "users:pin"
            )
        return view_func(request, *args, **kwargs)

    return wrapper
