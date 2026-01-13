from django.shortcuts import render

from .models import Home, Resident, FIELDS


def home(request):
    return render(request, "people/home.html")


def new_person(request):
    homes = Home.objects.all()
    hosts = Resident.objects.select_related("person", "home").all()
    return render(request, "people/new.html", {"homes": homes, "hosts": hosts, "fields": FIELDS})
