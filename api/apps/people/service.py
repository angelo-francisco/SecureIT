import base64
import sqlite3
from io import BytesIO
from uuid import uuid4

import numpy as np
import sqlite_vec
import torch
from core.config import settings
from core.exceptions import NotFound, ValidationError_
from facenet_pytorch import MTCNN, InceptionResnetV1
from PIL import Image
from tortoise.expressions import Q

from apps.people.models import (
    Home,
    Person,
    PersonRole,
    Resident,
    ResidentHome,
    Visit,
    VisitDestiny,
    Visitor,
    Worker,
    WorkerHome,
)
from apps.people.schemas import VALID_VISITOR_KEYS

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
    data = ""
    if "," in photo_b64:
        data = photo_b64.split(",")[1]
    return base64.b64decode(data)


def generate_face_embedding(
    base64_str: str | None = None, image: Image.Image | None = None
) -> bytes:

    if base64_str:
        image_data = base64_to_bytes(base64_str)
        image = Image.open(BytesIO(image_data)).convert("RGB")
    elif image:
        image = image.convert("RGB")
    else:
        raise ValueError("É necessário fornecer base64 ou uma imagem PIL")

    face = _get_mtcnn()(image)
    if face is None:
        raise ValidationError_(
            "Nenhum rosto detectado. Tente novamente com melhor iluminação e o rosto visível."
        )

    with torch.no_grad():
        embedding = _get_resnet()(face.unsqueeze(0))

    return embedding.cpu().numpy().astype(np.float32).flatten().tobytes()


def treat_photo(base64_photo: str) -> tuple[bytes, Image.Image]:
    image_data = base64_to_bytes(base64_photo)
    if not image_data:
        raise ValidationError_("Capture o rosto do indivíduo, por favor.")
    image = Image.open(BytesIO(image_data))
    return image_data, image


async def list_people(
    search_query: str = "",
    page: int = 1,
    per_page: int = 10,
) -> tuple[list[Person], int]:
    query = Person.all().prefetch_related(
        "resident__resident_homes__home",
        "visitor",
        "worker__worker_homes__home",
        "person_roles__role",
    )
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
        "resident__resident_homes__home",
        "visitor",
        "worker__worker_homes__home",
        "person_roles__role",
    )
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
    resident_data=None,
    worker_data=None,
    visitor_data=None,
) -> Person:
    person = await get_person(person_id)

    if first_name:
        person.first_name = first_name
    if last_name:
        person.last_name = last_name

    if photo_bytes:
        filename = f"{uuid4()}.jpeg"
        photo_path = f"people_photos/{filename}"
        media_path = settings.MEDIA_ROOT / "people_photos"
        media_path.mkdir(parents=True, exist_ok=True)
        with open(media_path / filename, "wb") as f:
            f.write(photo_bytes)
        person.photo = photo_path

    await person.save()

    if person.type == "R" and resident_data:
        resident = await Resident.get_or_none(person=person)
        if resident:
            bi = resident_data.get("bi", resident.bi)
            resident.bi = bi.upper()
            await resident.save()
            homes = resident_data.get("homes")
            if homes is not None:
                await ResidentHome.filter(resident=resident).delete()
                for home_id in homes:
                    await ResidentHome.create(resident=resident, home_id=home_id)

    elif person.type == "W" and worker_data:
        worker = await Worker.get_or_none(person=person)
        if worker:
            bi = worker_data.get("bi", worker.bi)
            fields = worker_data.get("fields")
            worker.bi = bi.upper()
            if fields:
                worker.fields = ",".join(fields)
            await worker.save()
            homes = worker_data.get("homes")
            if homes is not None:
                await WorkerHome.filter(worker=worker).delete()
                for home_id in homes:
                    await WorkerHome.create(worker=worker, home_id=home_id)

    elif person.type == "V" and visitor_data:
        visitor = await Visitor.get_or_none(person=person)
        if visitor:
            vt = visitor_data.get("visitor_type")
            if vt:
                visitor.type = vt
                await visitor.save()

    return person


async def delete_person(person_id: int):
    person = await Person.get_or_none(id=person_id)
    if not person:
        raise NotFound("Pessoa não encontrada")
    await person.delete()


async def create_visit(
    visitor_id: int,
    desc: str | None = None,
    destinies: list[int] | None = None,
) -> Visit:
    visitor = await Visitor.get_or_none(id=visitor_id)
    if not visitor:
        raise NotFound("Visitante não encontrado")

    visit = await Visit.create(visitor=visitor, desc=desc)

    if destinies:
        for resident_id in destinies:
            resident = await Resident.get_or_none(id=resident_id)
            if resident:
                await VisitDestiny.create(visit=visit, resident=resident)

    return visit


async def search_by_face(photo_base64: str) -> Person | None:
    embedding = generate_face_embedding(base64_str=photo_base64)

    conn = sqlite3.connect(
        str(settings.BASE_DIR / "db.sqlite3"), check_same_thread=False
    )
    conn.enable_load_extension(True)
    sqlite_vec.load(conn)
    conn.enable_load_extension(False)

    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT PP.id
        FROM PersonEmbedding AS PE
        INNER JOIN people AS PP ON PE.person = PP.id
        WHERE PE.embedding MATCH ? AND k = ?
        ORDER BY PE.distance
        """,
        (embedding, 1),
    )
    row = cursor.fetchone()
    conn.close()

    if row:
        return await get_person(row[0])
    return None


async def list_homes() -> list[Home]:
    return await Home.all()


async def list_residents() -> list[Resident]:
    return await Resident.all().prefetch_related("person")
