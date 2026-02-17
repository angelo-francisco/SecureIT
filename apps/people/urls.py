from django.urls import path

from .views import home, new_person, get_person, delete_person, edit_person

app_name = "people"

urlpatterns = [
    path("", home, name="home"),
    path("new/", new_person, name="new"),
    path("<int:person_id>/", get_person, name="details"),
    path("<int:person_id>/edit", edit_person, name="edit"),
    path("<int:person_id>/del", delete_person, name="delete"),
]
