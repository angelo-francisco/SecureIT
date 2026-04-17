from django.contrib import admin

from .models import User


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = [
        "first_name",
        "last_name",
        "is_active",
        "is_superuser",
        "email",
        "last_login",
        "date_joined",
    ]
    search_fields = ["first_name", "last_name"]
    list_filter = ["last_login", "date_joined"]
