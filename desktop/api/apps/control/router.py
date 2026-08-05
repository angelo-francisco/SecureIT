from fastapi import APIRouter, HTTPException

from apps.control.models import Profile as ProfileModel
from apps.control.schemas import Profile as ProfileSchema

router = APIRouter(prefix="/control", tags=["control"])


@router.post("/add-profile", status_code=201)
async def add_profile(data: ProfileSchema):
    # Idempotent: if the profile already exists (same user_id + profile_id),
    # return it successfully instead of failing on the primary key constraint.
    existing = await ProfileModel.get_or_none(
        user_id=data.user_id, profile_id=data.profile_id
    )
    if existing is not None:
        return {
            "user_id": existing.user_id,
            "profile_id": existing.profile_id,
            "created": False,
        }

    try:
        created = await ProfileModel.create(
            user_id=data.user_id, profile_id=data.profile_id
        )
        return {
            "user_id": created.user_id,
            "profile_id": created.profile_id,
            "created": True,
        }
    except Exception as exc:
        # Concurrent duplicate insert: another request may have created the row
        # between our get_or_none and create. Re-read and report success.
        existing = await ProfileModel.get_or_none(
            user_id=data.user_id, profile_id=data.profile_id
        )
        if existing is not None:
            return {
                "user_id": existing.user_id,
                "profile_id": existing.profile_id,
                "created": False,
            }
        raise HTTPException(status_code=500, detail=f"failed to add profile: {exc}")
