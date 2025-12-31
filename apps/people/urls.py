from django.urls import path

from .views import (
    people
)

app_name = "people"

urlpatterns = [path("people/", people, name="home")]