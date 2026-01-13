from django.db import models


class Person(models.Model):
    first_name = models.CharField(max_length=80)
    last_name = models.CharField(max_length=80)
    type = models.CharField(
        max_length=1, choices=[("R", "Residente"), ("V", "Visitante"), ("W", "Worker")]
    )
    photo = models.CharField(max_length=200)
    added_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    banned = models.BooleanField(default=False)


class Visitor(models.Model):
    person = models.OneToOneField(
        "Person", on_delete=models.DO_NOTHING, related_name="visitor"
    )
    host = models.ForeignKey(
        "Person", on_delete=models.DO_NOTHING, related_name="hosts"
    )


class Residents(models.Model):
    person = models.OneToOneField(
        "Person", on_delete=models.DO_NOTHING, related_name="resident"
    )
    home = models.CharField(max_length=5)


class Worker(models.Model):
    person = models.OneToOneField(
        "Person", on_delete=models.DO_NOTHING, related_name="worker"
    )
    work_for = models.ManyToManyField(Person, related_name="bosses")
    field = models.CharField(
        max_length=3,
        choices=[
            ("AL", "Auxiliar de Limpeza"),
            ("G", "Guarda"),
            ("J", "Jardineiro(a)"),
            ("E", "Eletricista"),
            ("EA", "Entregador(a) de Água"),
            ("O", "Outro"),
        ],
    )
