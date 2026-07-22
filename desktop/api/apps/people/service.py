import base64
import logging
from io import BytesIO
from uuid import uuid4

import numpy as np
import torch
from core.config import settings
from core.exceptions import NotFound, ValidationError_
from facenet_pytorch import MTCNN, InceptionResnetV1
from PIL import Image, ImageOps
from tortoise import Tortoise
from tortoise.expressions import Q, RawSQL

from apps.people.models import Person, PersonEmbedding, PersonRole, Role
from apps.people.schemas import (
    PersonRoleCreate,
)
from apps.audit.service import log_action

_mtcnn = None
_resnet = None

logger = logging.getLogger(__name__)


def _get_mtcnn():
    global _mtcnn
    if _mtcnn is None:
        _mtcnn = MTCNN(
            image_size=320,
            margin=0,
            select_largest=True,
            post_process=True,
            device="cpu",
        )
    return _mtcnn


def _get_resnet():
    global _resnet
    if _resnet is None:
        _resnet = InceptionResnetV1(pretrained="vggface2").eval().to("cpu")
    return _resnet


def base64_to_bytes(photo_b64: str) -> bytes:
    if "," in photo_b64:
        photo_b64 = photo_b64.split(",")[1]
    return base64.b64decode(photo_b64)


def generate_face_embedding(
    base64_str: str | None = None,
    image: Image.Image | None = None,
    detect_face: bool = True,
) -> list[float]:

    if base64_str:
        image_data = base64_to_bytes(base64_str)
        image = Image.open(BytesIO(image_data))
        image = ImageOps.exif_transpose(image).convert("RGB")
    elif image:
        image = ImageOps.exif_transpose(image).convert("RGB")
    else:
        raise ValueError("É necessário fornecer base64 ou uma imagem PIL")

    if detect_face:
        face = _get_mtcnn()(image)
        if face is None:
            raise ValidationError_(
                "Nenhum rosto detectado. Tente novamente com melhor iluminação e o rosto visível."
            )
    else:
        mtcnn_instance = _get_mtcnn()
        img_size = (
            mtcnn_instance.image_size if hasattr(mtcnn_instance, "image_size") else 160
        )
        face_img = image.resize((img_size, img_size), Image.BILINEAR)
        face = torch.tensor(np.array(face_img), dtype=torch.float32).permute(2, 0, 1)
        face = (face - 127.5) / 128.0
        face = face.to("cpu")

    with torch.no_grad():
        embedding = _get_resnet()(face.unsqueeze(0))

    return embedding.cpu().flatten().tolist()


def treat_photo(base64_photo: str) -> tuple[bytes, Image.Image]:
    image_data = base64_to_bytes(base64_photo)
    if not image_data:
        raise ValidationError_("Capture o rosto do indivíduo, por favor.")
    image = Image.open(BytesIO(image_data))
    image = ImageOps.exif_transpose(image)

    buffer = BytesIO()
    image.save(buffer, format="JPEG")
    photo_bytes = buffer.getvalue()

    return photo_bytes, image


async def list_people(
    search_query: str = "",
    page: int = 1,
    per_page: int = 10,
) -> tuple[list[Person], int]:
    query = Person.all().prefetch_related("person_roles__role")
    if search_query:
        query = query.filter(
            Q(first_name__icontains=search_query) | Q(last_name__icontains=search_query)
        )
    total = await query.count()
    offset = (page - 1) * per_page
    people = await query.offset(offset).limit(per_page)
    return people, total


async def get_person(person_id: int) -> Person:
    person = await Person.get_or_none(id=person_id).prefetch_related(
        "person_roles__role"
    )
    if not person:
        raise NotFound("Pessoa não encontrada")
    return person


def get_role_ids(roles: list[PersonRoleCreate]):
    r = []
    for role in roles:
        role_id = role.role_id
        if not role_id:
            raise ValidationError_("ID do cargo é obrigatório")
        r.append(role_id)
    return r


def create_person_role_list(
    person: Person, roles: list[PersonRoleCreate], fetched: list[Role]
) -> list:
    r = []
    roles_map = {role.id: role for role in fetched}
    for role_data in roles:
        field_values = role_data.field_values or {}
        logger.critical(field_values)
        role_id = role_data.role_id
        role = roles_map.get(role_id)

        if not role:
            raise ValidationError_(f"Cargo {role_id} não encontrado")

        if role.fields:  # type: ignore
            for field in role.fields:  # type: ignore
                if field.required and not field_values.get(field.label):
                    raise ValidationError_(
                        f"O campo '{field.label}' é obrigatório para o cargo '{role.name}'"
                    )
        r.append(
            PersonRole(
                person=person,
                role_id=role_id,
                field_values=field_values,
            )
        )
    return r


async def create_person(
    first_name: str,
    last_name: str,
    photo_bytes: bytes,
    roles_data: list[PersonRoleCreate] | None = None,
) -> Person:
    if not first_name or not last_name:
        raise ValidationError_("Preencha todos os campos, por favor.")

    filename = f"{uuid4()}.jpeg"
    photo_path = f"people_photos/{filename}"
    media_path = settings.MEDIA_ROOT / "people_photos"
    media_path.mkdir(parents=True, exist_ok=True)
    with open(media_path / filename, "wb") as f:
        f.write(photo_bytes)

    person = await Person.create(
        first_name=first_name,
        last_name=last_name,
        photo=photo_path,
    )

    if roles_data:
        role_ids = get_role_ids(roles_data)
        roles_fetched = await Role.filter(id__in=role_ids).prefetch_related("fields")

        await PersonRole.bulk_create(
            create_person_role_list(person, roles_data, roles_fetched)
        )
    await log_action("create", "person", person.id)
    return person


async def update_person(
    person_id: int,
    first_name: str | None = None,
    last_name: str | None = None,
    photo_bytes: bytes | None = None,
    roles_data: list[PersonRoleCreate] | None = None,
    banned: bool | None = None,
) -> Person:
    person = await get_person(person_id)

    if first_name:
        person.first_name = first_name
    if last_name:
        person.last_name = last_name
    if banned is not None:
        person.banned = banned

    if photo_bytes:
        filename = f"{uuid4()}.jpeg"
        photo_path = f"people_photos/{filename}"
        media_path = settings.MEDIA_ROOT / "people_photos"
        media_path.mkdir(parents=True, exist_ok=True)
        with open(media_path / filename, "wb") as f:
            f.write(photo_bytes)
        person.photo = photo_path

    await person.save()

    if roles_data is not None:
        await PersonRole.filter(person=person).delete()
        role_ids = get_role_ids(roles_data)
        roles_fetched = await Role.filter(id__in=role_ids).prefetch_related("fields")

        await PersonRole.bulk_create(
            create_person_role_list(person, roles_data, roles_fetched)
        )

    await person.fetch_related("person_roles__role")
    await log_action("update", "person", person.id)
    return person


async def delete_person(person_id: int):
    person = await Person.get_or_none(id=person_id)
    if not person:
        raise NotFound("Pessoa não encontrada")
    await person.delete()
    await log_action("delete", "person", person_id)


async def search_by_embedding(emb_list: list[float]) -> Person | None:
    emb_str = "[" + ",".join(map(str, emb_list)) + "]"
    conn = Tortoise.get_connection("default")
    result = await conn.execute_query(
        f"""
        SELECT p.id
        FROM person_embeddings pe
        INNER JOIN people p ON p.id = pe.person_id
        ORDER BY pe.embedding <=> '{emb_str}'::vector
        LIMIT 1
        """,
    )
    if result and result[1]:
        person = await Person.get(id=result[1][0]["id"])
        await person.fetch_related("person_roles__role")
        return person
    return None


async def search_by_face(photo_base64: str) -> Person | None:
    embedding = generate_face_embedding(base64_str=photo_base64)
    emb_list = np.frombuffer(embedding, dtype=np.float32).tolist()
    emb_str = "[" + ",".join(map(str, emb_list)) + "]"

    pe = await (
        PersonEmbedding.annotate(distance=RawSQL(f"embedding <=> '{emb_str}'::vector"))
        .order_by("distance")
        .limit(1)
        .select_related("person")
        .first()
    )

    if pe:
        return pe.person
    return None
