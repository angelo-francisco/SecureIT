import base64
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

from apps.people.models import (
    Person,
    PersonEmbedding,
    PersonRole,
)

_mtcnn = None
_resnet = None


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
    detect_face: bool = True
) -> bytes:

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
        img_size = mtcnn_instance.image_size if hasattr(mtcnn_instance, "image_size") else 160
        face_img = image.resize((img_size, img_size), Image.BILINEAR)
        face = torch.tensor(np.array(face_img), dtype=torch.float32).permute(2, 0, 1)
        face = (face - 127.5) / 128.0
        face = face.to("cpu")

    with torch.no_grad():
        embedding = _get_resnet()(face.unsqueeze(0))

    return embedding.cpu().numpy().astype(np.float32).flatten().tobytes()


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
    person = await Person.get_or_none(id=person_id).prefetch_related("person_roles__role")
    if not person:
        raise NotFound("Pessoa não encontrada")
    return person


async def create_person(
    first_name: str,
    last_name: str,
    photo_bytes: bytes,
    user_id: int | None = None,
    roles_data: list | None = None,
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
        type="U",
        photo=photo_path,
    )

    if roles_data:
        for role_data in roles_data:
            role_id = role_data.get("role_id")
            if not role_id:
                raise ValidationError_("ID do cargo é obrigatório")

            from apps.people.models import Role
            role = await Role.get_or_none(id=role_id)
            if not role:
                raise ValidationError_(f"Cargo {role_id} não encontrado")

            field_values = role_data.get("field_values") or {}

            if role.fields:
                await role.fetch_related("fields")
                for field in role.fields:
                    if field.required and field.label not in field_values:
                        raise ValidationError_(f"O campo '{field.label}' é obrigatório para o cargo '{role.name}'")

            await PersonRole.create(
                person=person,
                role_id=role_id,
                field_values=field_values,
            )

    return person


async def update_person(
    person_id: int,
    first_name: str | None = None,
    last_name: str | None = None,
    photo_bytes: bytes | None = None,
    roles_data: list | None = None,
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
        for role_data in roles_data:
            role_id = role_data.get("role_id")
            if not role_id:
                raise ValidationError_("ID do cargo é obrigatório")

            from apps.people.models import Role
            role = await Role.get_or_none(id=role_id)
            if not role:
                raise ValidationError_(f"Cargo {role_id} não encontrado")

            field_values = role_data.get("field_values") or {}
            await PersonRole.create(
                person=person,
                role_id=role_id,
                field_values=field_values,
            )

    # Refresh the relation cache so the serializer sees the updated roles
    await person.fetch_related("person_roles__role")

    return person


async def delete_person(person_id: int):
    person = await Person.get_or_none(id=person_id)
    if not person:
        raise NotFound("Pessoa não encontrada")
    await person.delete()


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
        PersonEmbedding
        .annotate(distance=RawSQL(f"embedding <=> '{emb_str}'::vector"))
        .order_by("distance")
        .limit(1)
        .select_related("person")
        .first()
    )

    if pe:
        return pe.person
    return None



