from fastapi import APIRouter, Query, Request, Depends

from apps.face_detection.schemas import FaceDetectionResponse
from apps.face_detection.service import list_face_detections
from core.deps import require_profile, Profile

router = APIRouter(prefix="/face-detections", tags=["face-detections"])


@router.get("")
async def list_face_detections_endpoint(
    request: Request,
    profile: Profile = Depends(require_profile),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    known_only: bool = Query(False),
):
    detections, total = await list_face_detections(
        profile.profile_id, page, per_page, known_only
    )
    return {
        "results": [FaceDetectionResponse.model_validate(d) for d in detections],
        "has_next": total > page * per_page,
        "has_previous": page > 1,
        "number": page,
        "num_pages": (total + per_page - 1) // per_page,
    }
