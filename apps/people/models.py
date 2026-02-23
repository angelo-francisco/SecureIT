from django.db import models

from .choices import VISITOR_TYPES, FIELD_TYPES_DICT, PERSON_TYPES


class Person(models.Model):
    first_name = models.CharField(max_length=30)
    last_name = models.CharField(max_length=30)
    type = models.CharField(max_length=1, choices=PERSON_TYPES)
    photo = models.ImageField(upload_to="people_photos/")
    added_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    banned = models.BooleanField(default=False)  # type: ignore

    @property
    def full_name(self):
        return str(self.first_name) + " " + str(self.last_name)


class Home(models.Model):
    number = models.PositiveIntegerField()
    street = models.CharField(max_length=30)

    @staticmethod
    def get_home(home_id: int):
        return Home.objects.filter(id=home_id).first()  # type: ignore


class Visitor(models.Model):
    type = models.CharField(max_length=3, choices=VISITOR_TYPES)
    person = models.OneToOneField("Person", on_delete=models.CASCADE)


class Visit(models.Model):  # change in diagram
    visitor = models.ForeignKey("Visitor", on_delete=models.CASCADE)
    desc = models.TextField(null=True, blank=True)
    visited_at = models.DateTimeField(auto_now_add=True)


class VisitDestiny(models.Model):  # add to diagram
    visit = models.ForeignKey(Visit, on_delete=models.CASCADE)
    resident = models.ForeignKey("Resident", on_delete=models.CASCADE)


class Resident(models.Model):
    bi = models.CharField(max_length=14, unique=True)
    person = models.OneToOneField("Person", on_delete=models.CASCADE)


class ResidentHome(models.Model):
    resident = models.ForeignKey("Resident", on_delete=models.CASCADE)
    home = models.ForeignKey("Home", on_delete=models.CASCADE)


class Worker(models.Model):
    bi = models.CharField(max_length=14, unique=True)
    person = models.OneToOneField(
        "Person", on_delete=models.CASCADE, related_name="worker"
    )
    fields = models.CharField(max_length=30)

    @property
    def get_formatted_fields(self):
        return ", ".join([FIELD_TYPES_DICT[f] for f in self.fields.split(",")])  # type: ignore

    @property
    def list_fields(self):
        return self.fields.split(",")  # type: ignore

    @property
    def work_homes(self):
        return list(self.workerhome_set.values_list("home_id", flat=True))  # type: ignore


class WorkerHome(models.Model):
    worker = models.ForeignKey("Worker", on_delete=models.CASCADE)
    home = models.ForeignKey("Home", on_delete=models.CASCADE)
