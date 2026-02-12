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
    VisitorHost,
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
    base64_photo: str, filename="image.jpg"
) -> tuple[ContentFile, ImageFile]:
    image_data = base64_to_bytes(base64_photo)
    image = Image.open(BytesIO(image_data))
    buffer = BytesIO()
    image.save(buffer, format=image.format or "JPEG")

    return ContentFile(buffer.getvalue(), name=filename), image


def validate_bi(bi):
    if not bi or len(bi) != 14:
        raise ValidationError("Preencha correctamente o BI")
    return bi.upper()


def validate_homes(homes):
    try:
        homes = [int(h) for h in homes]
    except:  # NOQA
        raise ValidationError("Informe correctamente os nºs. das casas")

    if homes and not Home.objects.filter(id__in=homes).exists():  # type: ignore
        raise ValidationError("As casas selecionadas não existem")

    return homes


def validate_fields(fields):
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


def create_person(first_name, last_name, person_type, photo) -> Person:
    if not first_name or not last_name or not person_type:
        raise ValidationError("Preencha todos os campos")

    if not photo:
        raise ValidationError("Faça a captura de rosto")

    if person_type not in ["W", "V", "R"]:
        raise ValidationError("Tipo de pessoa inválido")

    person = Person.objects.create(  # type: ignore
        first_name=first_name,
        last_name=last_name,
        type=person_type,
    )
    person.photo.save(f"{uuid4()}.jpeg", photo)
    return person


def create_resident(person_id, homes, bi):
    homes = validate_homes(homes)
    bi = validate_bi(bi)

    resident = Resident.objects.create(person_id=person_id, bi=bi)  # type: ignore
    ResidentHome.objects.bulk_create(  # type: ignore
        [ResidentHome(resident_id=resident.id, home_id=home) for home in homes]
    )
    return resident


def create_worker(person_id, bi, homes, fields) -> Worker:
    homes = validate_homes(homes)

    if not homes:
        raise ValidationError("Informe o seu local de trabalho")

    bi = validate_bi(bi)
    fields = validate_fields(fields)

    worker = Worker.objects.create(person_id=person_id, bi=bi, fields=fields)  # type: ignore
    WorkerHome.objects.bulk_create(  # type: ignore
        [WorkerHome(worker_id=worker.id, home_id=home) for home in homes]
    )
    return worker


def create_visitor(person_id: int, host_id: str, visitor_type: str) -> Visitor:
    host = validate_host(host_id)
    visitor_type = validate_visitor_type(visitor_type)

    visitor = Visitor.objects.create(person_id=person_id, type=visitor_type)  # type: ignore
    VisitorHost.objects.create(visitor_id=visitor.id, host_id=host.id)  # type: ignore
    return visitor
