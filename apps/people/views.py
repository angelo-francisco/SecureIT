import base64
from io import BytesIO
from uuid import uuid4

from django.contrib import messages
from django.core.exceptions import ValidationError
from django.core.files.base import ContentFile
from django.shortcuts import redirect, render
from PIL import Image

from .db import insert_person_embedding
from .models import (
    FIELDS,
    Home,
    Person,
    Resident,
    ResidentHome,
    Visitor,
    VisitorHost,
    Worker,
    WorkerHome,
)


def base64_to_image_file(base64_str, filename="image.jpg"):
    if not base64_str:
        return

    if "," in base64_str:
        base64_str = base64_str.split(",")[1]

    image_data = base64.b64decode(base64_str)
    image = Image.open(BytesIO(image_data))

    buffer = BytesIO()
    image.save(buffer, format=image.format or "JPEG")

    return ContentFile(buffer.getvalue(), name=filename)


def get_validated_resident(homes: list[str], bi: str) -> tuple:
    homes = None
    try:
        homes = [int(id) for id in homes]
    except TypeError:
        raise ValidationError("Informe correctamente os nºs. das casas")

    if not bi or len(bi) != 14:
        raise ValidationError("Preencha correctamente o BI")
    elif not Home.objects.filter(id__in=homes).exists():
        raise ValidationError("Nº. de casa inválido")
    return homes, bi


def get_validated_visitor(host_id: str | int):
    if isinstance(host_id, str) and not host_id.isdigit():
        raise ValidationError("Anfitrião inválido")
    else:
        host_id = int(host_id)

    host = Resident.objects.filter(id=host_id).only("id").first()

    if not host:
        raise ValidationError("Anfitrião não encontrado")
    return host


def get_validated_worker(homes: list[str], bi: str, fields: list[str]) -> tuple:
    homes = None
    try:
        homes = [int(id) for id in homes]
    except TypeError:
        raise ValidationError("Informe correctamente os nºs. das casas")

    if not bi or len(bi) != 14:
        raise ValidationError("Preencha correctamente o BI")
    elif not Home.objects.filter(id__in=homes).exists():
        raise ValidationError("Nº. de casa inválido")
    original_fields = [
        "AL",
        "G",
        "J",
        "E",
        "EA",
        "O",
    ]
    if not fields:
        raise ValidationError("Áreas de trabalho não informadas")

    for field in fields:
        if field not in original_fields:
            raise ValidationError("Área de trabalho inválida")
    return homes, bi, ",".join(fields)


def home(request):
    return render(request, "people/home.html")


def create_person(first_name, last_name, person_type, photo):
    person = Person(
        first_name=first_name,
        last_name=last_name,
        type=person_type,
    ).save()
    person.photo.save(f"{uuid4}.jpeg", photo)
    return person


def new_person(request):
    homes = Home.objects.all()
    hosts = ResidentHome.objects.select_related("resident", "home").all()
    response = render(
        request,
        "people/new.html",
        {"homes": homes, "hosts": hosts, "fields": FIELDS},
    )
    if request.method == "POST":
        first_name = request.POST.get("first_name", "")
        last_name = request.POST.get("last_name", "")
        person_type = request.POST.get("person_type", "")
        photo = base64_to_image_file(request.POST.get("photo", "").strip())

        if not first_name or not last_name or not person_type or not photo:
            messages.error(request, "Preencha todos os campos e capture o rosto")
        elif person_type not in ["R", "W", "V"]:
            messages.error(request, "Selecione o tipo de pessoa certo")

        elif person_type == "R":
            try:
                homes, bi = get_validated_resident(
                    request.POST.getlist("homes", []), request.POST.get("bi", "")
                )

                person = create_person(first_name, last_name, person_type, photo)
                resident = Resident(person_id=person.id, bi=bi)
                resident.save()

                resident_homes = [
                    ResidentHome(resident_id=resident.id, home_id=home)
                    for home in homes
                ]
                ResidentHome.objects.bulk_create(resident_homes)
            except Exception as e:
                messages.error(request, e.message)
        elif person_type == "V":
            try:
                host = get_validated_visitor(request.POST.get("host", ""))

                person = create_person(first_name, last_name, person_type, photo)
                visitor = Visitor(person_id=person.id)
                visitor.save()

                VisitorHost(visitor_id=visitor.id, host_id=host.id)
            except Exception as e:
                messages.error(request, e.message)
        elif person_type == "W":
            try:
                homes, bi, fields = get_validated_worker(
                    request.POST.getlist("homes", []),
                    request.POST.get("bi", ""),
                    request.POST.getlist("fields", []),
                )

                person = create_person(first_name, last_name, person_type, photo)
                worker = Worker(person_id=person.id, bi=bi, fields=fields)
                worker.save()

                worker_homes = [
                    WorkerHome(worker_id=worker.id, home_id=home) for home in homes
                ]
                WorkerHome.objects.bulk_create(worker_homes)
            except Exception as e:
                messages.error(request, e.message)
        messages.success("Pessoa cadastrada com sucesso")
        return redirect("people:home")
    return response
