from fastapi import APIRouter, Depends, Query

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
from core.deps import require_profile, Profile
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/cameras", tags=["cameras"])


@router.get("", response_model=ListCameras)
async def list_cameras_endpoint(
    profile: Profile = Depends(require_profile),
    search_query: str = Query(""),
    page: int = Query(1, ge=1),
):
    return await list_cameras(profile.profile_id, search_query, page)


@router.post("", response_model={}, status_code=201)
async def create_camera_endpoint(
    data: CameraCreate,
    profile: Profile = Depends(require_profile),
):
    await create_camera_service(profile.profile_id, data)
    return {}


@router.get("/available", response_model=list[AvailableCamera])
async def available_cameras(
    refresh: bool = Query(False),
):
    return await get_available_cameras(refresh)


@router.get("/{camera_id}", response_model=CameraDetail)
async def get_camera_endpoint(
    camera_id: int,
    profile: Profile = Depends(require_profile),
):
    return await get_camera(camera_id, profile.profile_id)


@router.put("/{camera_id}", response_model=CameraDetail)
async def update_camera_endpoint(
    camera_id: int,
    data: CameraUpdate,
    profile: Profile = Depends(require_profile),
):
    return await update_camera_service(
        camera_id, profile.profile_id, data.model_dump(exclude_unset=True)
    )


@router.delete("/{camera_id}", status_code=200)
async def delete_camera_endpoint(
    camera_id: int,
    profile: Profile = Depends(require_profile),
):
    await delete_camera_service(camera_id, profile.profile_id)
    return {"message": "deleted"}
