from fastapi import APIRouter, Query, Request

from apps.cameras.schemas import (
    AvailableCamera,
    CameraCreate,
    CameraDetailResponse,
    CameraResponse,
    CameraUpdate,
)
from apps.cameras.service import (
    create_camera as create_camera_service,
    delete_camera as delete_camera_service,
    get_available_cameras,
    get_camera,
    list_cameras,
    update_camera as update_camera_service,
)

router = APIRouter(prefix="/cameras", tags=["cameras"])


@router.get("", response_model=list[CameraResponse])
async def list_cameras_endpoint(
    request: Request,
    search_query: str = Query(""),
    page: int = Query(1, ge=1),
):
    cameras = await list_cameras(request.state.user.id, search_query, page)
    result = []
    for c in cameras:
        r = CameraResponse.model_validate(c)
        r.video_source = await c.video_source
        result.append(r)
    return result


@router.post("", response_model=CameraDetailResponse, status_code=201)
async def create_camera_endpoint(
    request: Request,
    data: CameraCreate,
):
    camera = await create_camera_service(request.state.user.id, data)
    return CameraDetailResponse.model_validate(camera)


@router.get("/available", response_model=list[AvailableCamera])
async def available_cameras():
    return await get_available_cameras()


@router.get("/{camera_id}", response_model=CameraDetailResponse)
async def get_camera_endpoint(
    request: Request,
    camera_id: int,
):
    camera = await get_camera(camera_id, request.state.user.id)
    return CameraDetailResponse.model_validate(camera)


@router.put("/{camera_id}", response_model=CameraDetailResponse)
async def update_camera_endpoint(
    request: Request,
    camera_id: int,
    data: CameraUpdate,
):
    camera = await update_camera_service(
        camera_id, request.state.user.id, data.model_dump(exclude_unset=True)
    )
    return CameraDetailResponse.model_validate(camera)


@router.delete("/{camera_id}", status_code=204)
async def delete_camera_endpoint(
    request: Request,
    camera_id: int,
):
    await delete_camera_service(camera_id, request.state.user.id)
