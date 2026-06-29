from fastapi import APIRouter, Query, Request

from apps.cameras.schemas import (
    AvailableCamera,
    CameraCreate,
    CameraUpdate,
    CameraDetail,
    ListCameras,
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


@router.get("", response_model=ListCameras)
async def list_cameras_endpoint(
    request: Request,
    search_query: str = Query(""),
    page: int = Query(1, ge=1),
):
    return await list_cameras(request.state.user.id, search_query, page)


@router.post("", response_model={}, status_code=201)
async def create_camera_endpoint(
    request: Request,
    data: CameraCreate,
):
    await create_camera_service(request.state.user.id, data)
    return {}


@router.get("/available", response_model=list[AvailableCamera])
async def available_cameras():
    return await get_available_cameras()


@router.get("/{camera_id}", response_model=CameraDetail)
async def get_camera_endpoint(
    request: Request,
    camera_id: int,
):
    return await get_camera(camera_id, request.state.user.id)


@router.put("/{camera_id}", response_model=CameraDetail)
async def update_camera_endpoint(
    request: Request,
    camera_id: int,
    data: CameraUpdate,
):
    return await update_camera_service(
        camera_id, request.state.user.id, data.model_dump(exclude_unset=True)
    )


@router.delete("/{camera_id}", status_code=200)
async def delete_camera_endpoint(
    request: Request,
    camera_id: int,
):
    await delete_camera_service(camera_id, request.state.user.id)
    return {"message": "deleted"}
