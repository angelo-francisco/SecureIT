import numpy as np
from fastapi import APIRouter, Query, Request
from fastapi.responses import JSONResponse

from apps.people.models import PersonEmbedding

from apps.people.role_service import (
    create_role,
    delete_role,
    get_role,
    list_roles,
    update_role,
)
from apps.people.schemas import (
    FaceSearchRequest,
    PersonCreate,
    PersonResponse,
    RoleCreate,
    RoleResponse,
)
from apps.people.service import (
    create_person,
    delete_person,
    generate_face_embedding,
    get_person,
    list_people,
    search_by_face,
    treat_photo,
    update_person,
)
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/people", tags=["people"])


@router.get("/roles", response_model=list[RoleResponse])
async def list_roles_endpoint(request: Request):
    roles = await list_roles(request.state.user.id)
    return [RoleResponse.model_validate(r) for r in roles]


@router.post("/roles", response_model=RoleResponse, status_code=201)
async def create_role_endpoint(request: Request, data: RoleCreate):
    role = await create_role(
        user_id=request.state.user.id,
        name=data.name,
        description=data.description,
        fields=[f.model_dump() for f in data.fields],
    )
    return RoleResponse.model_validate(role)


@router.get("/roles/{role_id}", response_model=RoleResponse)
async def get_role_endpoint(request: Request, role_id: int):
    role = await get_role(role_id, request.state.user.id)
    return RoleResponse.model_validate(role)


@router.put("/roles/{role_id}", response_model=RoleResponse)
async def update_role_endpoint(request: Request, role_id: int, data: RoleCreate):
    role = await update_role(
        role_id,
        request.state.user.id,
        name=data.name,
        description=data.description,
    )
    if data.fields:
        from apps.people.models import RoleField

        await RoleField.filter(role_id=role_id).delete()
        for f in data.fields:
            await RoleField.create(
                role_id=role_id,
                label=f.label,
                field_type=f.field_type or "text",
                required=f.required or False,
                options=f.options,
            )
    return await get_role(role_id, request.state.user.id)


@router.delete("/roles/{role_id}", status_code=204)
async def delete_role_endpoint(request: Request, role_id: int):
    await delete_role(role_id, request.state.user.id)
    return {"message": "deleted"}


# ── Person CRUD ─────────────────────────────────────────────


@router.get("")
async def list_people_endpoint(
    search_query: str = Query(""),
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=100),
):
    people, total = await list_people(search_query, page, per_page)
    return {
        "results": [PersonResponse.model_validate(p) for p in people],
        "has_next": total > page * per_page,
        "has_previous": page > 1,
        "number": page,
        "num_pages": (total + per_page - 1) // per_page,
    }


@router.post("", response_model=PersonResponse, status_code=201)
async def create_person_endpoint(
    request: Request,
    data: PersonCreate,
):
    photo_bytes, image = treat_photo(data.photo_base64)
    embedding = generate_face_embedding(image=image)

    person = await create_person(
        first_name=data.first_name,
        last_name=data.last_name,
        photo_bytes=photo_bytes,
        user_id=request.state.user.id,
        roles_data=[r.model_dump() for r in data.roles],
    )

    emb_list = np.frombuffer(embedding, dtype=np.float32).tolist()
    await PersonEmbedding.create(person=person, embedding=emb_list)
    return PersonResponse.model_validate(person)


@router.get("/{person_id}", response_model=PersonResponse)
async def get_person_endpoint(
    person_id: int,
):
    person = await get_person(person_id)
    return PersonResponse.model_validate(person)


@router.put("/{person_id}", response_model=PersonResponse)
async def update_person_endpoint(
    person_id: int,
    data: PersonCreate,
):
    photo_bytes, image = (
        treat_photo(data.photo_base64) if data.photo_base64 else (None, None)
    )
    embedding = generate_face_embedding(image=image) if image else None

    person = await update_person(
        person_id,
        first_name=data.first_name,
        last_name=data.last_name,
        photo_bytes=photo_bytes,
        roles_data=[r.model_dump() for r in data.roles],
        banned=data.banned,
    )

    if embedding:
        emb_list = np.frombuffer(embedding, dtype=np.float32).tolist()
        emb_record, created = await PersonEmbedding.get_or_create(
            person_id=person.id,
            defaults={"embedding": emb_list}
        )
        if not created:
            emb_record.embedding = emb_list
            await emb_record.save()

    return PersonResponse.model_validate(person)


@router.delete("/{person_id}", status_code=204)
async def delete_person_endpoint(
    person_id: int,
):
    await delete_person(person_id)


@router.post("/search-by-face")
async def search_face_endpoint(
    data: FaceSearchRequest,
):
    person = await search_by_face(data.photo_base64)
    if person:
        return PersonResponse.model_validate(person)
    return JSONResponse(
        status_code=404,
        content={"detail": "Pessoa não registada"},
    )
