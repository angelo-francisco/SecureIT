from django.shortcuts import render


def home(request):
    return render(request, "people/home.html")


def new_person(request):
    return render(request, "people/new.html")