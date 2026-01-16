import base64
from io import BytesIO
from uuid import uuid4

from django.contrib import messages
from django.core.files.base import ContentFile
from django.shortcuts import redirect, render
from PIL import Image

from .models import FIELDS, Home, Person, Resident, ResidentHome, Visitor, VisitorHost


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
            homes = None
            try:
                homes = [int(id) for id in request.POST.getlist("homes", [])]
            except TypeError:
                messages.error(request, "Informe correctamente os nºs. das casas")
                return response
            bi = request.POST.get("bi", "")

            if not bi or len(bi) != 14:
                messages.error(request, "Preencha correctamente o BI")
            elif not Home.objects.filter(id__in=homes).exists():
                messages.error(request, "Nº. de casa inválido")

            person = Person(
                first_name=first_name,
                last_name=last_name,
                type=person_type,
            ).save()
            person.photo.save(f"{uuid4}.jpeg", photo)

            resident = Resident(
                person_id=person.id,
                bi=bi   
            ).save()

            resident_homes = [
                ResidentHome(
                    resident_id=resident.id,
                    home_id=home
                )
                for home in homes
            ]
            ResidentHome.objects.bulk_create(*resident_homes)
            
        # return redirect("people:home")
    return response
