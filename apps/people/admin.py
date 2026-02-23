from django.contrib import admin

from .models import (
    Home,
    Person,
    Resident,
    ResidentHome,
    Visitor,
    Visit,
    VisitDestiny,
    Worker,
    WorkerHome,
)

admin.site.register(
    [Home, Person, Resident, Visitor, Worker, Visit, VisitDestiny, WorkerHome, ResidentHome]
)
