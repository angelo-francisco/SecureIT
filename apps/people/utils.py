import base64
from io import BytesIO
from uuid import uuid4

import numpy as np
import torch
from django.core.exceptions import ValidationError
from django.core.files.base import ContentFile
from facenet_pytorch import MTCNN, InceptionResnetV1
from PIL import Image
from PIL.ImageFile import ImageFile

from .models import (
    Home,
    Person,
    Resident,
    ResidentHome,
    Visitor,
    Visit,
    VisitDestiny,
    Worker,
    WorkerHome,
)

mtcnn = MTCNN(
    image_size=160,
    margin=0,
    select_largest=True,
    post_process=True,
    device="cpu",
)

resnet = InceptionResnetV1(pretrained="vggface2").eval().to(mtcnn.device)

VALID_FIELDS = {"G", "M", "MA", "AL", "J", "E", "O"}
VALID_VISITORS = {"VR", "PE", "PS", "E", "O"}


def base64_to_bytes(photo_b64: str) -> bytes:
    data = ""
    if "," in photo_b64:
        data = photo_b64.split(",")[1]
    return base64.b64decode(data)


def generate_face_embedding(base64_str=None, image=None):
    if base64_str:
        image_data = base64_to_bytes(base64_str)
        image = Image.open(BytesIO(image_data)).convert("RGB")
    elif image:
        image = image.convert("RGB")
    else:
        raise ValueError("É necessário fornecer base64 ou uma imagem PIL")

    face = mtcnn(image)
    if face is None:
        return None

    with torch.no_grad():
        embedding = resnet(face.unsqueeze(0))

    return embedding.cpu().numpy().astype(np.float32).flatten().tobytes()


def treat_photo(
    base64_photo: str, filename=f"{uuid4()}.jpeg"
) -> tuple[ContentFile, ImageFile]:
    image_data = base64_to_bytes(base64_photo)
    image = Image.open(BytesIO(image_data))
    buffer = BytesIO()
    image.save(buffer, format=image.format or "JPEG")

    return ContentFile(buffer.getvalue(), name=filename), image


def validate_bi(bi: str):
    if not bi or len(bi) != 14:
        raise ValidationError("Preencha correctamente o BI")
    return bi.upper()


def validate_homes(_homes: list[str]) -> list[int]:
    try:
        homes = [int(h) for h in _homes]
    except:  # NOQA
        raise ValidationError("Informe correctamente os nºs. das casas")

    if homes and not Home.objects.filter(id__in=homes).exists():  # type: ignore
        raise ValidationError("As casas selecionadas não existem")

    return homes


def validate_residents(_residents: list[str]) -> list[int]:
    try:
        residents = [int(h) for h in _residents]
    except:  # NOQA
        raise ValidationError("Informe correctamente os residentes")

    if residents and not Resident.objects.filter(id__in=residents).exists():  # type: ignore
        raise ValidationError("Os residentes selecionados não existem")

    return residents


def validate_fields(fields: list[str]) -> str:
    vfl = VALID_FIELDS

    if not fields:
        raise ValidationError("Áreas de trabalho não informadas")

    if set(fields) - vfl:
        raise ValidationError("Área de trabalho inválida")
    return ",".join(fields)


def validate_visitor_type(visitor_type: str):
    if not visitor_type:
        raise ValidationError("Tipo de visitante não informado")

    if visitor_type not in VALID_VISITORS:
        raise ValidationError("Tipo de visitante inválida")
    return visitor_type


def validate_host(host_id: str):
    if not host_id.isdigit():
        raise ValidationError("Anfitrião inválido")

    host = Resident.objects.filter(id=int(host_id)).only("id").first()  # type: ignore
    if not host:
        raise ValidationError("Anfitrião não encontrado")

    return host


def update_instace(instance, data: dict):
    update_fields = []

    for key, value in data.items():
        if getattr(instance, key) != value:
            setattr(instance, key, value)
            update_fields.append(key)

    if update_fields:
        instance.save(update_fields=update_fields)


def update_m2m(model, k1_name, k1_value, k2: str, new: set):
    current = set(
        model.objects.filter(**{k1_name: k1_value}).values_list(k2, flat=True)  # type: ignore
    )

    to_add = new - current
    to_remove = current - new

    if to_add:
        model.objects.bulk_create(  # type: ignore
            [model(**{k1_name: k1_value, f"{k2}_id": obj_id}) for obj_id in to_add]
        )

    if to_remove:
        model.objects.filter(  # type: ignore
            **{k1_name: k1_value, f"{k2}_id__in": to_remove}
        ).delete()


def create_person(first_name: str, last_name: str, person_type: str, photo) -> Person:
    if not first_name or not last_name or not person_type:
        raise ValidationError("Preencha todos os campos")

    if not photo:
        raise ValidationError("Faça a captura de rosto")

    if person_type not in ["W", "V", "R"]:
        raise ValidationError("Tipo de pessoa inválido")

    person = Person.objects.create(  # type: ignore
        first_name=first_name, last_name=last_name, type=person_type, photo=photo
    )
    return person


def edit_person(person: Person, first_name: str, last_name: str, photo):
    if not first_name or not last_name:
        raise ValidationError("Preencha todos os campos")

    update_instace(person, {"first_name": first_name, "last_name": last_name})

    if photo:
        person.photo.save(f"{uuid4()}.jpeg", photo)  # type: ignore


def create_resident(person_id: int, _homes: list[str], bi: str) -> Resident:
    homes = validate_homes(_homes)
    bi = validate_bi(bi)

    if not homes:
        raise ValidationError("Informe pelo menos uma residência")

    resident = Resident.objects.create(person_id=person_id, bi=bi)  # type: ignore
    ResidentHome.objects.bulk_create(  # type: ignore
        [ResidentHome(resident_id=resident.id, home_id=home) for home in homes]
    )
    return resident


def edit_resident(resident: Resident, _homes: list[str], bi: str):
    homes = validate_homes(_homes)
    bi = validate_bi(bi)

    if not homes:
        raise ValidationError("Informe pelo menos uma residência")

    update_instace(resident, {"bi": bi})
    update_m2m(ResidentHome, "resident", resident, "home", set(homes))


def create_worker(
    person_id: int, bi: str, _homes: list[str], _fields: list[str]
) -> Worker:
    homes = validate_homes(_homes)

    if not homes:
        raise ValidationError("Informe o seu local de trabalho")

    bi = validate_bi(bi)
    fields = validate_fields(_fields)

    worker = Worker.objects.create(person_id=person_id, bi=bi, fields=fields)  # type: ignore

    WorkerHome.objects.bulk_create(  # type: ignore
        [WorkerHome(worker_id=worker.id, home_id=home) for home in homes]
    )
    return worker


def edit_worker(worker: Worker, bi: str, _homes: list[str], _fields: list[str]):
    homes = validate_homes(_homes)

    if not homes:
        raise ValidationError("Informe o seu local de trabalho")

    bi = validate_bi(bi)
    fields = validate_fields(_fields)

    update_instace(worker, {"bi": bi, "fields": fields})
    update_m2m(WorkerHome, "worker", worker, "home", set(homes))


def create_visitor(person_id: int, host_id: str, visitor_type: str) -> Visitor:
    host = validate_host(host_id)
    visitor_type = validate_visitor_type(visitor_type)

    visitor = Visitor.objects.create(person_id=person_id, type=visitor_type)  # type: ignore
    visit = Visit.objects.create(visitor_id=visitor.id)  # type: ignore
    VisitDestiny.objects.create(visit_id=visit.id, resident_id=host) # type: ignore
    return visitor


def edit_visitor(visitor: Visitor, visitor_type: str):
    visitor_type = validate_visitor_type(visitor_type)
    update_instace(visitor, {"type": visitor_type})
