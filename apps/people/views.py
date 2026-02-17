from django.contrib import messages
from django.core.paginator import Paginator
from django.core.validators import ValidationError
from django.db import close_old_connections
from django.db.models import Value
from django.db.models.functions import Concat
from django.shortcuts import get_object_or_404, redirect, render
from django.urls import reverse

from .choices import FIELD_TYPES, VISITOR_TYPES
from .db import insert_person_embedding, search_person_by_embedding
from .models import Home, Person, ResidentHome, VisitorHost
from .utils import (
    create_person,
    create_resident,
    create_visitor,
    create_worker,
    edit_resident,
    edit_visitor,
    edit_worker,
    generate_face_embedding,
    treat_photo,
)
from .utils import (
    edit_person as util_edit_person,
)


class SearchError(ValidationError):
    pass


def home(request):
    context = {}
    people_queryset = Person.objects.all()  # type: ignore
    search_query = request.GET.get("search_query", "").strip()
    page_number = request.GET.get("page", "")

    if search_query:
        people_queryset = people_queryset.annotate(
            new_full_name=Concat(
                "first_name",
                Value(" "),
                "last_name",
            )
        ).filter(  # type: ignore
            new_full_name__icontains=search_query
        )
    paginator = Paginator(people_queryset, 10)
    context["people"] = paginator.get_page(page_number)

    if request.method == "POST":
        try:
            photo_b64 = request.POST.get("photo", "")
            if not photo_b64:
                raise ValidationError("Nenhuma foto foi enviada")

            photo_embedding = generate_face_embedding(photo_b64)
            people = search_person_by_embedding(photo_embedding)
            if people:
                return redirect(reverse("people:details", args=[people[0][0]]))
            raise SearchError("Pessoa não registada")
        except Exception as error:
            msg = (
                error.message  # type: ignore
                if getattr(error, "message", False)
                else "Pessoa não registada"
            )
            messages.error(request, msg)

    return render(request, "people/home.html", context)


def new_person(request):
    context = {
        "homes": Home.objects.all(),  # type: ignore
        "hosts": ResidentHome.objects.select_related("resident__person", "home").all(),  # type: ignore
        "fields": FIELD_TYPES,
        "visitor_types": VISITOR_TYPES,
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

        match str(person.type):
            case "R":
                create_resident(
                    person.pk,
                    request.POST.getlist("resident-homes", []),
                    request.POST.get("resident-bi", ""),
                )
            case "W":
                create_worker(
                    person.pk,
                    request.POST.get("worker-bi", ""),
                    request.POST.getlist("worker-homes", []),
                    request.POST.getlist("worker-fields", []),
                )
            case "V":
                create_visitor(
                    person.pk,
                    request.POST.get("visitor-host", ""),
                    request.POST.get("visitor-type", ""),
                )

        # Fechando conexões antigas para impedir lock do banco de dados
        close_old_connections()
        embedding = generate_face_embedding(image=image)
        insert_person_embedding(person.pk, embedding)

        messages.success(request, "Pessoa cadastrada com sucesso")
        return redirect(reverse("people:details", args=[person.pk]))
    except Exception as error:
        print(error)
        if person:
            person.delete()
        msg = (
            error.message  # type: ignore
            if getattr(error, "message", False)
            else "Erro ao cadastrar, verifique os campos, por favor."
        )
        messages.error(request, msg)
        return render(request, "people/new.html", context)


def get_person(request, person_id):
    person = get_object_or_404(Person, id=person_id)
    context = {"person": person}

    if person.type == "V":
        visitor_hosts = VisitorHost.objects.filter(visitor_id=person.visitor.id)  # type: ignore
        search_query = request.GET.get("search_query", "").strip()

        if search_query:
            visitor_hosts = visitor_hosts.annotate(
                full_name=Concat(
                    "host__person__first_name",
                    Value(" "),
                    "host__person__last_name",
                )
            ).filter(  # type: ignore
                full_name__icontains=search_query
            )
        paginator = Paginator(visitor_hosts, 10)
        page = request.GET.get("page", "")
        context["visitor_hosts"] = paginator.get_page(page)

    return render(request, "people/details.html", context)


def delete_person(request, person_id: int):
    person = get_object_or_404(Person, id=person_id)
    person.delete()
    return redirect("people:home")


def edit_person(request, person_id: int):
    person = get_object_or_404(Person, id=person_id)
    context = {"person": person}

    if person.type == "R":
        context["homes"] = Home.objects.all()  # type: ignore
        context["resident_homes"] = person.resident.residenthome_set.values_list(
            "home_id", flat=True
        )
    elif person.type == "V":
        context["visitor_types"] = VISITOR_TYPES
    else:
        context["fields"] = FIELD_TYPES
        context["homes"] = Home.objects.all()  # type: ignore

    if request.method != "POST":
        return render(request, "people/edit.html", context)
    try:
        content_file, image = [None] * 2
        photo_base64 = request.POST.get("photo", "").strip()

        if photo_base64:
            content_file, image = treat_photo(photo_base64)

        util_edit_person(
            person=person,
            first_name=request.POST.get("first_name", "").strip(),
            last_name=request.POST.get("last_name", "").strip(),
            photo=content_file,
        )

        match str(person.type):
            case "R":
                edit_resident(
                    person.resident,
                    request.POST.getlist("resident-homes", []),
                    request.POST.get("resident-bi", ""),
                )
            case "W":
                edit_worker(
                    person.worker,
                    request.POST.get("worker-bi", ""),
                    request.POST.getlist("worker-homes", []),
                    request.POST.getlist("worker-fields", []),
                )
            case "V":
                edit_visitor(
                    person.visitor,
                    request.POST.get("visitor-type", ""),
                )

        if content_file and image:
            close_old_connections()
            embedding = generate_face_embedding(image=image)
            insert_person_embedding(person.pk, embedding)

        messages.success(request, "Pessoa editada com sucesso")
        return redirect(reverse("people:details", args=[person.pk]))
    except Exception as error:
        msg = (
            error.message  # type: ignore
            if getattr(error, "message", False)
            else "Erro ao editar, verifique os campos, por favor."
        )
        messages.error(request, msg)
        return render(request, "people/edit.html", context)


def new_visit(request, visitor_id: int): ...
