from fastapi import APIRouter, Depends, Query
from fastapi.responses import JSONResponse

from apps.auth.models import User
from apps.people.schemas import (
    FaceSearchRequest,
    HomeResponse,
    PersonCreate,
    PersonResponse,
    PersonUpdate,
    ResidentCreate,
    VisitCreate,
    VisitResponse,
    VisitorCreate,
    WorkerCreate,
)
from apps.people.service import (
    create_person,
    create_visit,
    delete_person,
    generate_face_embedding,
    get_person,
    list_homes,
    list_people,
    list_residents,
    search_by_face,
    treat_photo,
    update_person,
)
from core.deps import verify_pin

router = APIRouter(prefix="/people", tags=["people"])


@router.get("", response_model=list[PersonResponse])
async def list_people_endpoint(
    search_query: str = Query(""),
    page: int = Query(1, ge=1),
    current_user: User = Depends(verify_pin),
):
    people, _ = await list_people(search_query, page)
    return [PersonResponse.model_validate(p) for p in people]


@router.post("", response_model=PersonResponse, status_code=201)
async def create_person_endpoint(
    data: PersonCreate,
    resident: ResidentCreate | None = None,
    worker: WorkerCreate | None = None,
    visitor: VisitorCreate | None = None,
    current_user: User = Depends(verify_pin),
):
    photo_bytes, image = treat_photo(data.photo_base64)
    embedding = generate_face_embedding(image=image)

    resident_data = None
    worker_data = None
    visitor_data = None

    if data.person_type == "R" and resident:
        resident_data = resident.model_dump()
    elif data.person_type == "W" and worker:
        worker_data = worker.model_dump()
    elif data.person_type == "V" and visitor:
        visitor_data = visitor.model_dump()

    person = await create_person(
        first_name=data.first_name,
        last_name=data.last_name,
        person_type=data.person_type,
        photo_bytes=photo_bytes,
        resident_data=resident_data,
        worker_data=worker_data,
        visitor_data=visitor_data,
    )

    import sqlite3
    import sqlite_vec
    conn = sqlite3.connect("db.sqlite3", check_same_thread=False)
    conn.enable_load_extension(True)
    sqlite_vec.load(conn)
    conn.enable_load_extension(False)
    conn.execute(
        "INSERT INTO PersonEmbedding (person, embedding) VALUES (?, ?)",
        (person.id, embedding),
    )
    conn.commit()
    conn.close()

    return PersonResponse.model_validate(person)


@router.get("/homes", response_model=list[HomeResponse])
async def list_homes_endpoint(
    current_user: User = Depends(verify_pin),
):
    homes = await list_homes()
    return [HomeResponse.model_validate(h) for h in homes]


@router.get("/residents")
async def list_residents_endpoint(
    current_user: User = Depends(verify_pin),
):
    residents = await list_residents()
    return [
        {"id": r.id, "person_id": r.person_id, "full_name": r.person.full_name}
        for r in residents
    ]


@router.get("/{person_id}", response_model=PersonResponse)
async def get_person_endpoint(
    person_id: int,
    current_user: User = Depends(verify_pin),
):
    person = await get_person(person_id)
    return PersonResponse.model_validate(person)


@router.put("/{person_id}", response_model=PersonResponse)
async def update_person_endpoint(
    person_id: int,
    data: PersonUpdate,
    resident: ResidentCreate | None = None,
    worker: WorkerCreate | None = None,
    visitor: VisitorCreate | None = None,
    current_user: User = Depends(verify_pin),
):
    photo_bytes = None
    if data.photo_base64:
        photo_bytes, image = treat_photo(data.photo_base64)

    person = await update_person(
        person_id,
        first_name=data.first_name,
        last_name=data.last_name,
        photo_bytes=photo_bytes,
        resident_data=resident.model_dump() if resident else None,
        worker_data=worker.model_dump() if worker else None,
        visitor_data=visitor.model_dump() if visitor else None,
    )

    if photo_bytes:
        embedding = generate_face_embedding(image=image)
        import sqlite3
        import sqlite_vec
        conn = sqlite3.connect("db.sqlite3", check_same_thread=False)
        conn.enable_load_extension(True)
        sqlite_vec.load(conn)
        conn.enable_load_extension(False)
        conn.execute(
            "INSERT INTO PersonEmbedding (person, embedding) VALUES (?, ?)",
            (person.id, embedding),
        )
        conn.commit()
        conn.close()

    return PersonResponse.model_validate(person)


@router.delete("/{person_id}", status_code=204)
async def delete_person_endpoint(
    person_id: int,
    current_user: User = Depends(verify_pin),
):
    await delete_person(person_id)


@router.post("/{visitor_id}/visits", response_model=VisitResponse, status_code=201)
async def create_visit_endpoint(
    visitor_id: int,
    data: VisitCreate,
    current_user: User = Depends(verify_pin),
):
    visit = await create_visit(visitor_id, data.desc, data.destinies)
    return VisitResponse.model_validate(visit)


@router.post("/search-by-face")
async def search_face_endpoint(
    data: FaceSearchRequest,
    current_user: User = Depends(verify_pin),
):
    person = await search_by_face(data.photo_base64)
    if person:
        return PersonResponse.model_validate(person)
    return JSONResponse(
        status_code=404,
        content={"detail": "Pessoa não registada"},
    )
