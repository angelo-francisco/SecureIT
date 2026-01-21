import base64
from io import BytesIO
from uuid import uuid4

import numpy as np
import torch
from django.core.exceptions import ValidationError
from django.core.files.base import ContentFile
from facenet_pytorch import MTCNN, InceptionResnetV1
from PIL import Image

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

VALID_FIELDS = {"AL", "G", "J", "E", "EA", "O"}

mtcnn = MTCNN(
    image_size=160,
    margin=0,
    select_largest=True,
    post_process=True,
    device="cpu",
)

resnet = InceptionResnetV1(pretrained="vggface2").eval().to(mtcnn.device)


def generate_face_embedding(base64_str=None, image=None):
    if base64_str:
        image_data = base64.b64decode(base64_str)
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


def treat_photo(base64_str, filename="image.jpg"):
    if not base64_str:
        return

    if "," in base64_str:
        base64_str = base64_str.split(",")[1]

    image_data = base64.b64decode(base64_str)
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

    if not Home.objects.filter(id__in=homes).exists():
        raise ValidationError("As casas selecionadas não existem")

    return homes


def validate_fields(fields):
    vfl = VALID_FIELDS

    if not fields:
        raise ValidationError("Áreas de trabalho não informadas")

    if set(fields) - vfl:
        raise ValidationError("Área de trabalho inválida")
    return ",".join(fields)


def create_person(first_name, last_name, person_type, photo):
    if not first_name or not last_name or not person_type:
        raise ValidationError("Preencha todos os campos")

    if not photo:
        raise ValidationError("Faça a captura de rosto")

    if person_type not in ["W", "V", "R"]:
        raise ValidationError("Tipo de pessoa inválido")

    person = Person.objects.create(
        first_name=first_name,
        last_name=last_name,
        type=person_type,
    )
    person.photo.save(f"{uuid4()}.jpeg", photo)
    return person


def create_resident(person_id, homes, bi):
    homes = validate_homes(homes)
    bi = validate_bi(bi)

    resident = Resident.objects.create(person_id=person_id, bi=bi)
    ResidentHome.objects.bulk_create(
        [ResidentHome(resident_id=resident.id, home_id=home) for home in homes]
    )
    return resident


def create_worker(person_id, bi, homes, fields):
    homes = validate_homes(homes)
    bi = validate_bi(bi)
    fields = validate_fields(fields)

    worker = Worker.objects.create(person_id=person_id, bi=bi, fields=fields)
    WorkerHome.objects.bulk_create(
        [WorkerHome(worker_id=worker.id, home_id=home) for home in homes]
    )
    return worker


def create_visitor(person_id, host_id):
    if isinstance(host_id, str) and not host_id.isdigit():
        raise ValidationError("Anfitrião inválido")
    else:
        host_id = int(host_id)

    host = Resident.objects.filter(id=host_id).only("id").first()

    if not host:
        raise ValidationError("Anfitrião não encontrado")

    visitor = Visitor.objects.create(person_id=person_id)
    VisitorHost.objects.create(visitor_id=visitor.id, host_id=host.id)

    return visitor
