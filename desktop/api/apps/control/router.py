from fastapi import APIRouter

from apps.control.models import Profile as ProfileModel
from apps.control.schemas import Profile as ProfileSchema

router = APIRouter(prefix="/control", tags=["control"])


@router.post("/add-profile", status_code=201)
async def add_profile(data: ProfileSchema):
    return await ProfileModel.get_or_create(
        user_id=data.user_id, profile_id=data.profile_id
    )
