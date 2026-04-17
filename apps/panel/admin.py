from django.contrib import admin

from .models import Configuration


@admin.register(Configuration)
class ConfigurationAdmin(admin.ModelAdmin):
    list_display = ["user", "fps", "monitoring_start_time", "monitoring_end_time"]
