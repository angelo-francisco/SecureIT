from django.contrib import admin

from .models import (
    Home,
    Person,
    Resident,
    ResidentHome,
    Visit,
    VisitDestiny,
    Visitor,
    Worker,
    WorkerHome,
)



@admin.register(Person)
class PersonAdmin(admin.ModelAdmin):
    list_display = (
        "full_name",
        "type",
        "banned",
        "added_at",
        "updated_at",
    )
    list_filter = ("type", "banned", "added_at")
    search_fields = ("first_name", "last_name")
    ordering = ("first_name",)

    fieldsets = (
        (
            "Informações Básicas",
            {"fields": ("first_name", "last_name", "type", "photo")},
        ),
        ("Estado", {"fields": ("banned",)}),
        (
            "Registos do Sistema",
            {"fields": ("added_at", "updated_at"), "classes": ("collapse",)},
        ),
    )

    readonly_fields = ("added_at", "updated_at")


@admin.register(Home)
class HomeAdmin(admin.ModelAdmin):
    list_display = ("id", "number", "street")
    search_fields = ("number", "street")
    ordering = ("number",)


@admin.register(Visitor)
class VisitorAdmin(admin.ModelAdmin):
    list_display = ("person", "type")
    list_filter = ("type",)
    search_fields = (
        "person__first_name",
        "person__last_name",
    )


@admin.register(Visit)
class VisitAdmin(admin.ModelAdmin):
    list_display = ("visitor", "desc", "visited_at")
    list_filter = ("visited_at",)
    search_fields = (
        "visitor__person__first_name",
        "visitor__person__last_name",
        "desc",
    )
    date_hierarchy = "visited_at"


@admin.register(VisitDestiny)
class VisitDestinyAdmin(admin.ModelAdmin):
    list_display = ("visit", "resident")


@admin.register(Resident)
class ResidentAdmin(admin.ModelAdmin):
    list_display = ("person", "bi")
    search_fields = (
        "bi",
        "person__first_name",
        "person__last_name",
    )
    autocomplete_fields = ("person",)


@admin.register(Worker)
class WorkerAdmin(admin.ModelAdmin):
    list_display = (
        "person",
        "bi",
        "get_formatted_fields",
    )
    search_fields = (
        "bi",
        "person__first_name",
        "person__last_name",
    )
    autocomplete_fields = ("person",)


@admin.register(WorkerHome)
class WorkerHomeAdmin(admin.ModelAdmin):
    list_display = ("worker", "home")
    autocomplete_fields = ("worker", "home")


@admin.register(ResidentHome)
class ResidentHomeAdmin(admin.ModelAdmin):
    list_display = ("resident", "home")
    autocomplete_fields = ("resident", "home")
