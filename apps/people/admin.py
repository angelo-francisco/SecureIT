from django.contrib import admin

from .models import Home, Person, Resident, Visitor, VisitorHost, Worker, Worker_Home

admin.site.register([Home, Person, Resident, Visitor, Worker, VisitorHost, Worker_Home])
