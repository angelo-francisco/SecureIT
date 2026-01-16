from django.contrib import admin

from .models import (
    Home,
    Person,
    Resident,
    Visitor,
    VisitorHost,
    Worker,
    WorkerHome,
    ResidentHome,
)

admin.site.register(
    [Home, Person, Resident, Visitor, Worker, VisitorHost, WorkerHome, ResidentHome]
)
