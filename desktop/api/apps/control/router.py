from fastapi import APIRouter

from apps.control.models import Profile as ProfileModel
from apps.control.schemas import Profile as ProfileSchema

router = APIRouter(prefix="/control", tags=["control"])


@router.post("/add-profile", status_code=201)
async def add_profile(data: ProfileSchema):
    profile, created = await ProfileModel.get_or_create(
        profile_id=data.profile_id,
        user_id=data.user_id,
    )
    return {
        "user_id": profile.user_id,
        "profile_id": profile.profile_id,
        "created": created,
    }
