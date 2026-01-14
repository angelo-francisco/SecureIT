from django.contrib.auth import get_user_model
from django.contrib.auth import login as django_login
from django.contrib.auth import logout as django_logout
from django.contrib.auth.decorators import login_not_required
from django.shortcuts import redirect, render

User = get_user_model()


@login_not_required
def signup(request):
    return render(request, "users/signup.html")


@login_not_required
def login(request):
    return render(request, "users/login.html")


@login_not_required
def pin(request):
    return render(request, "users/pin.html")


def logout(request):
    return redirect("")
