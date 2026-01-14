from django.db import models

FIELDS = [
    ("AL", "Auxiliar de Limpeza"),
    ("G", "Guarda"),
    ("J", "Jardineiro(a)"),
    ("E", "Eletricista"),
    ("EA", "Entregador(a) de Água"),
    ("O", "Outro"),
]

TYPES = [
    ("R", "Residente"),
    ("V", "Visitante"),
    ("W", "Trabalhador"),
]


class Person(models.Model):
    first_name = models.CharField(max_length=80)
    last_name = models.CharField(max_length=80)
    type = models.CharField(max_length=1, choices=TYPES)
    photo = models.ImageField(upload_to="people_photos/")
    added_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    banned = models.BooleanField(default=False)


class Home(models.Model):
    number = models.PositiveIntegerField()
    street = models.CharField(max_length=30)


class Visitor(models.Model):
    person = models.OneToOneField("Person", on_delete=models.DO_NOTHING)


class VisitorHost(models.Model):
    visitor = models.ForeignKey("Visitor", on_delete=models.DO_NOTHING)
    host = models.ForeignKey("Person", on_delete=models.DO_NOTHING)


class Resident(models.Model):
    bi = models.CharField(max_length=14, unique=True)
    person = models.ForeignKey("Person", on_delete=models.DO_NOTHING)
    home = models.ForeignKey("Home", on_delete=models.CASCADE)


class Worker(models.Model):
    bi = models.CharField(max_length=14, unique=True)
    person = models.OneToOneField(
        "Person", on_delete=models.DO_NOTHING, related_name="worker"
    )
    field = models.CharField(max_length=6)


class Worker_Home(models.Model):
    worker = models.ForeignKey("Worker", on_delete=models.DO_NOTHING)
    home = models.ForeignKey("Home", on_delete=models.CASCADE)
