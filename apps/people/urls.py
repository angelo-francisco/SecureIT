from django.urls import path

from .views import home, new_person

app_name = "people"

urlpatterns = [
    path("", home, name="home"),
    path("new/", new_person, name="new"),
]
