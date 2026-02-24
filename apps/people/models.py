from django.db import models

from .choices import VISITOR_TYPES, FIELD_TYPES_DICT, PERSON_TYPES


class Person(models.Model):
    first_name = models.CharField(max_length=30)
    last_name = models.CharField(max_length=30)
    type = models.CharField(
        max_length=1, choices=PERSON_TYPES, verbose_name="Tipo de Pessoa"
    )
    photo = models.ImageField(upload_to="people_photos/")
    added_at = models.DateTimeField(auto_now_add=True, verbose_name="Data de Adição")
    updated_at = models.DateTimeField(
        auto_now=True, verbose_name="Data de Actualizaçõa"
    )
    banned = models.BooleanField(default=False, verbose_name="Banido")  # type: ignore

    @property
    def full_name(self):
        return str(self.first_name) + " " + str(self.last_name)

    full_name.fget.short_description = "Nome"  # type: ignore

    def __str__(self):
        return self.full_name

    class Meta:
        verbose_name = "Pessoa"
        verbose_name_plural = "Pessoas"


class Home(models.Model):
    number = models.PositiveIntegerField(verbose_name="Número")
    street = models.CharField(max_length=30, verbose_name="Rua")

    @staticmethod
    def get_home(home_id: int):
        return Home.objects.filter(id=home_id).first()  # type: ignore

    def __str__(self):
        return f"I{self.number}"

    class Meta:
        verbose_name = "Casa"
        verbose_name_plural = "Casas"


class Visitor(models.Model):
    type = models.CharField(
        max_length=3, choices=VISITOR_TYPES, verbose_name="Tipo de Visitante"
    )
    person = models.OneToOneField(
        "Person", on_delete=models.CASCADE, verbose_name="Pessoa"
    )

    def __str__(self):
        return self.person.full_name

    class Meta:
        verbose_name = "Visitante"
        verbose_name_plural = "Visitantes"


class Visit(models.Model):  # change in diagram
    visitor = models.ForeignKey(
        "Visitor", on_delete=models.CASCADE, verbose_name="Visitante"
    )
    desc = models.TextField(null=True, blank=True, verbose_name="Descrição")
    visited_at = models.DateTimeField(auto_now_add=True, verbose_name="Data da Visita")

    def __str__(self) -> str:
        return self.visitor.person.full_name

    class Meta:
        verbose_name = "Visita"
        verbose_name_plural = "Visitas"


class VisitDestiny(models.Model):  # add to diagram
    visit = models.ForeignKey(Visit, on_delete=models.CASCADE, verbose_name="Visitante")
    resident = models.ForeignKey(
        "Resident", on_delete=models.CASCADE, verbose_name="Residente"
    )

    class Meta:
        verbose_name = "Destino da Visita"
        verbose_name_plural = "Destinos das Visitas"


class Resident(models.Model):
    bi = models.CharField(
        max_length=14, unique=True, verbose_name="Bilhete de Identidade"
    )
    person = models.OneToOneField(
        "Person", on_delete=models.CASCADE, verbose_name="Pessoa"
    )

    def __str__(self):
        return self.person.full_name

    class Meta:
        verbose_name = "Residente"
        verbose_name_plural = "Residentes"


class ResidentHome(models.Model):
    resident = models.ForeignKey(
        "Resident", on_delete=models.CASCADE, verbose_name="Residente"
    )
    home = models.ForeignKey("Home", on_delete=models.CASCADE, verbose_name="Casa")

    class Meta:
        verbose_name = "Casa do Residente"
        verbose_name_plural = "Casas dos Residentes"


class Worker(models.Model):
    bi = models.CharField(
        max_length=14, unique=True, verbose_name="Bilhete de Identidade"
    )
    person = models.OneToOneField(
        "Person", on_delete=models.CASCADE, related_name="worker", verbose_name="Pessoa"
    )
    fields = models.CharField(max_length=30, verbose_name="Áreas de Trabalho")

    @property
    def get_formatted_fields(self):
        return ", ".join([FIELD_TYPES_DICT[f] for f in self.fields.split(",")])  # type: ignore

    @property
    def list_fields(self):
        return self.fields.split(",")  # type: ignore

    @property
    def work_homes(self):
        return list(self.workerhome_set.values_list("home_id", flat=True))  # type: ignore

    def __str__(self):
        return self.person.full_name

    class Meta:
        verbose_name = "Trabalhador"
        verbose_name_plural = "Trabalhadores"


class WorkerHome(models.Model):
    worker = models.ForeignKey(
        "Worker", on_delete=models.CASCADE, verbose_name="Trabalhador"
    )
    home = models.ForeignKey("Home", on_delete=models.CASCADE, verbose_name="Casa")

    class Meta:
        verbose_name = "Casa de trabalho do trabalhador"
        verbose_name_plural = "Casas de trabalho dos trabalhadores"
