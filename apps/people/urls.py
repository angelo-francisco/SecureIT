from django.urls import path

from .views import home, new_person, get_person

app_name = "people"

urlpatterns = [
    path("", home, name="home"),
    path("new/", new_person, name="new"),
    path("<int:id>/", get_person, name="details")
]
