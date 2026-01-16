import base64
from io import BytesIO
from uuid import uuid4

from django.contrib import messages
from django.core.files.base import ContentFile
from django.shortcuts import redirect, render
from PIL import Image
from django.core.exceptions import ValidationError
from .models import FIELDS, Home, Person, Resident, ResidentHome, Visitor, VisitorHost
from .db import insert_person_embedding

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


def home(request):
    return render(request, "people/home.html")


def validate_and_format_data_resident(homes: list[str], bi: str) -> tuple:
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
                homes, bi = validate_and_format_data_resident(
                    request.POST.getlist("homes", []), request.POST.get("bi", "")
                )

                person = create_person(first_name, last_name, person_type, photo)
                resident = Resident(person_id=person.id, bi=bi)
                resident.save()

                resident_homes = [
                    ResidentHome(resident_id=resident.id, home_id=home)
                    for home in homes
                ]
                ResidentHome.objects.bulk_create(*resident_homes)
            except Exception as e:
                messages.error(request, e.message)

        # return redirect("people:home")
    return response
