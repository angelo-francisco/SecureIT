from django.contrib import messages
from django.shortcuts import redirect, render

from .db import insert_person_embedding
from .models import FIELDS, Home, Person, ResidentHome
from .utils import (
    create_person,
    create_resident,
    create_visitor,
    create_worker,
    generate_face_embedding,
    treat_photo,
)


def home(request):
    context = {"people": Person.objects.all()}
    return render(request, "people/home.html", context)


def new_person(request):
    context = {
        "homes": Home.objects.all(),
        "hosts": ResidentHome.objects.select_related("resident", "home"),
        "fields": FIELDS,
    }

    if request.method != "POST":
        return render(request, "people/new.html", context)
    person = None
    try:
        photo_base64 = request.POST.get("photo", "").strip()
        content_file, image = treat_photo(photo_base64)

        person = create_person(
            first_name=request.POST.get("first_name", "").strip(),
            last_name=request.POST.get("last_name", "").strip(),
            person_type=request.POST.get("person_type", "").strip(),
            photo=content_file,
        )

        match person.type:
            case "R":
                create_resident(
                    person.id,
                    request.POST.getlist("resident-homes", []),
                    request.POST.get("resident-bi", ""),
                )
            case "W":
                create_worker(
                    person.id,
                    request.POST.get("worker-bi", ""),
                    request.POST.getlist("worker-homes", []),
                    request.POST.getlist("worker-fields", []),
                )
            case "V":
                create_visitor(person.id, request.POST.get("visitor-host", ""))

        embedding = generate_face_embedding(image=image)
        insert_person_embedding(person.id, embedding)

        messages.success(request, "Pessoa cadastrada com sucesso")
        return redirect("people:home")
    except Exception as error:
        if person:
            person.delete()
        msg = (
            error.message
            if getattr(error, "message", False)
            else "Erro ao cadastrar, verifique os campos, por favor."
        )
        print(error)
        messages.error(request, msg)
        return render(request, "people/new.html", context)
