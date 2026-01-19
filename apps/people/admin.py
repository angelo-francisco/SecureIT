from django.contrib import admin

from .models import (
    Home,
    Person,
    Resident,
    ResidentHome,
    Visitor,
    VisitorHost,
    Worker,
    WorkerHome,
)

admin.site.register(
    [Home, Person, Resident, Visitor, Worker, VisitorHost, WorkerHome, ResidentHome]
)
