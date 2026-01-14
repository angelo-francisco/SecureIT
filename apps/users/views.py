from django.contrib.auth import get_user_model
from django.contrib.auth import login as dj_login
from django.contrib.auth import logout as dj_logout
from django.contrib.auth.decorators import login_not_required, login_required
from django.shortcuts import redirect, render

User = get_user_model()

def signup(request):
    return render(request, "users/signup.html")


def login_page(request):
    return render(request, "users/login.html")
