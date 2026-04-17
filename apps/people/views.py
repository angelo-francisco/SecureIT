from django.contrib import messages
from django.core.paginator import Paginator
from django.core.exceptions import ValidationError
from django.db import close_old_connections, transaction
from django.db.models import Value
from django.db.models.functions import Concat
from django.shortcuts import get_object_or_404, redirect, render
from django.urls import reverse

from .choices import FIELD_TYPES, VISITOR_TYPES
from .db import insert_person_embedding, search_person_by_embedding
from .models import Home, Person, Resident, ResidentHome, Visit, VisitDestiny, Visitor
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
    validate_residents,
)
from .utils import (
    edit_person as util_edit_person,
)
from core.utils import get_error_message as gem


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
            messages.error(request, gem(error))
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
    try:
        photo_base64 = request.POST.get("photo", "").strip()
        content_file, image = treat_photo(photo_base64)

        with transaction.atomic():
            person = create_person(
                first_name=request.POST.get("first_name", "").strip(),
                last_name=request.POST.get("last_name", "").strip(),
                person_type=request.POST.get("person_type", "").strip(),
                photo=content_file,
            )

            match person.type:
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
        messages.error(request, gem(error))
        return render(request, "people/new.html", context)


def get_person(request, person_id):
    person = get_object_or_404(
        Person.objects.select_related("resident", "visitor", "worker").prefetch_related(
            "resident__residenthome_set__home", "worker__workerhome_set__home"
        ),
        id=person_id,
    )
    context = {"person": person}

    if person.type == "V":
        context["visits"] = (  # type: ignore
            Visit.objects.filter(visitor_id=person.visitor.pk)  # type: ignore
            .prefetch_related("visitdestiny_set__resident__person")
            .order_by("-visited_at")
        )

    return render(request, "people/details.html", context)


def delete_person(request, person_id: int):
    person = get_object_or_404(Person, id=person_id)
    person.delete()
    return redirect("people:home")


def edit_person(request, person_id: int):
    person = get_object_or_404(
        Person.objects.select_related("resident", "visitor", "worker"),
        id=person_id,
    )

    context: dict = {"person": person}

    if person.type == "R":
        context["homes"] = Home.objects.all()  # type: ignore
        context["resident_homes"] = person.resident.residenthome_set.all().values_list(
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
            print(type(embedding))
            insert_person_embedding(person.pk, embedding)

        messages.success(request, "Pessoa editada com sucesso")
        return redirect(reverse("people:details", args=[person.pk]))
    except Exception as error:
        print(error)
        messages.error(request, gem(error))
        return render(request, "people/edit.html", context)


def new_visit(request, visitor_id: int):
    visitor = get_object_or_404(Visitor, id=visitor_id)
    residents = Resident.objects.all()  # type: ignore

    if request.method == "POST":
        try:
            desc = request.POST.get("desc", "")
            destinies = request.POST.getlist("destinies", [])

            residents = validate_residents(destinies)
            visit = Visit.objects.create(visitor=visitor, desc=desc)  # type: ignore
            VisitDestiny.objects.bulk_create(  # type: ignore
                [VisitDestiny(visit=visit, resident_id=r) for r in residents]
            )
            messages.success(request, "Visita registada")
            return redirect(reverse("people:details", args=[visitor.person.id]))
        except Exception as error:
            messages.error(request, gem(error))
    return render(
        request, "people/new_visit.html", {"visitor": visitor, "residents": residents}
    )
