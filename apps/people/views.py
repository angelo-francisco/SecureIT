from django.contrib import messages
from django.shortcuts import redirect, render

from .models import FIELDS, Home, ResidentHome
from .utils import (
    treat_photo,
    create_person,
    create_resident,
    create_visitor,
    create_worker,
)


def home(request):
    return render(request, "people/home.html")


def new_person(request):
    context = {
        "homes": Home.objects.all(),
        "hosts": ResidentHome.objects.select_related("resident", "home"),
        "fields": FIELDS,
    }

    if request.method != "POST":
        return render(request, "people/new.html", context)
    try:
        person = create_person(
            first_name=request.POST.get("first_name", "").strip(),
            last_name=request.POST.get("last_name", "").strip(),
            person_type=request.POST.get("person_type", "").strip(),
            photo=treat_photo(request.POST.get("photo", "").strip()),
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
        messages.success(request, "Pessoa cadastrada com sucesso")
        return redirect("people:home")
    except Exception as error:
        msg = (
            error.message
            if getattr(error, "message", False)
            else "Erro ao cadastrar, verifique os campos, por favor."
        )
        messages.error(request, msg)
        return render(request, "people/new.html", context)
