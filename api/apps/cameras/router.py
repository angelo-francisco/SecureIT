from fastapi import APIRouter, Depends, Query

from apps.auth.models import User
from apps.cameras.schemas import (
    AvailableCamera,
    CameraCreate,
    CameraDetailResponse,
    CameraResponse,
    CameraUpdate,
    LocalCameraCreate,
    WifiCameraCreate,
)
from apps.cameras.service import (
    create_camera as create_camera_service,
    delete_camera as delete_camera_service,
    get_available_cameras,
    get_camera,
    list_cameras,
    update_camera as update_camera_service,
)
from core.deps import get_current_user, verify_pin

router = APIRouter(prefix="/cameras", tags=["cameras"])


@router.get("", response_model=list[CameraResponse])
async def list_cameras_endpoint(
    search_query: str = Query(""),
    page: int = Query(1, ge=1),
    current_user: User = Depends(verify_pin),
):
    cameras = await list_cameras(current_user.id, search_query, page)
    result = []
    for c in cameras:
        r = CameraResponse.model_validate(c)
        r.video_source = await c.video_source
        result.append(r)
    return result


@router.post("", response_model=CameraDetailResponse, status_code=201)
async def create_camera_endpoint(
    data: CameraCreate,
    local: LocalCameraCreate | None = None,
    wifi: WifiCameraCreate | None = None,
    current_user: User = Depends(verify_pin),
):
    local_data = {"path": local.camera_path, "id": 0} if local else None
    camera = await create_camera_service(
        current_user.id, data,
        local_data=local_data,
        wifi_data=wifi,
    )
    return CameraDetailResponse.model_validate(camera)


@router.get("/available", response_model=list[AvailableCamera])
async def available_cameras(
    current_user: User = Depends(verify_pin),
):
    return await get_available_cameras()


@router.get("/{camera_id}", response_model=CameraDetailResponse)
async def get_camera_endpoint(
    camera_id: int,
    current_user: User = Depends(verify_pin),
):
    camera = await get_camera(camera_id, current_user.id)
    return CameraDetailResponse.model_validate(camera)


@router.put("/{camera_id}", response_model=CameraDetailResponse)
async def update_camera_endpoint(
    camera_id: int,
    data: CameraUpdate,
    current_user: User = Depends(verify_pin),
):
    camera = await update_camera_service(
        camera_id, current_user.id, data.model_dump(exclude_unset=True)
    )
    return CameraDetailResponse.model_validate(camera)


@router.delete("/{camera_id}", status_code=204)
async def delete_camera_endpoint(
    camera_id: int,
    current_user: User = Depends(verify_pin),
):
    await delete_camera_service(camera_id, current_user.id)
