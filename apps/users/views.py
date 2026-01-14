from django.shortcuts import render, redirect
from django.contrib.auth import login as dj_login, logout as dj_logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.decorators import login_not_required
from django.contrib.auth import get_user_model

User = get_user_model()

def signup(request):
    return render(request, "users/signup.html")


def login_page(request):
    return render(request, "users/login.html")
