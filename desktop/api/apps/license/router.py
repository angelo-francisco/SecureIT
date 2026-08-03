import math
from datetime import datetime, timezone

from core.crypto import verify_license_token
from core.config import settings
from core.hardware import get_hardware_fingerprint
from fastapi import APIRouter, HTTPException
import httpx

from .models import License
from .schemas import (
    LicenseClearRequest,
    LicenseFeaturesRequest,
    LicenseFeaturesResponse,
    LicenseResponse,
    LicenseStoreRequest,
    LicenseVerifyRequest,
    LicenseVerifyOnlineRequest,
)

router = APIRouter(prefix="/license", tags=["license"])

MAX_OFFLINE_DAYS = 30


def _parse_datetime(dt) -> datetime:
    if isinstance(dt, datetime):
        if dt.tzinfo is None:
            return dt.replace(tzinfo=timezone.utc)
        return dt
    if isinstance(dt, str):
        dt = datetime.fromisoformat(dt.replace("Z", "+00:00"))
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt
    return datetime.now(timezone.utc)


def _days_remaining(expires_at) -> int:
    exp = _parse_datetime(expires_at)
    now = datetime.now(timezone.utc)
    return max(0, math.ceil((exp - now).total_seconds() / 86400))


def _days_since(dt) -> int:
    if dt is None:
        return MAX_OFFLINE_DAYS + 1
    d = _parse_datetime(dt)
    now = datetime.now(timezone.utc)
    return math.ceil((now - d).total_seconds() / 86400)


@router.get("/fingerprint")
async def get_fingerprint():
    try:
        fp = get_hardware_fingerprint()
        return {"fingerprint": fp}
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/store")
async def store_license(data: LicenseStoreRequest):
    existing = await License.filter(user_id=data.user_id).first()
    if existing:
        await existing.delete()

    now = datetime.now(timezone.utc)
    license_obj = await License.create(
        license_id=data.license_id,
        user_id=data.user_id,
        license_key=data.license_key,
        license_type=data.license_type,
        activated_at=_parse_datetime(data.activated_at),
        expires_at=_parse_datetime(data.expires_at),
        last_validated_at=now,
        hardware_fingerprint=data.hardware_fingerprint,
        signed_payload=data.signed_payload,
        public_key=data.public_key,
        signature=data.signature,
        max_cameras=data.max_cameras,
        max_people=data.max_people,
        features=data.features,
        status=data.status,
    )

    return {
        "success": True,
        "license_id": license_obj.license_id,
    }


@router.post("/verify")
async def verify_license(data: LicenseVerifyRequest):
    license_obj = await License.filter(user_id=data.user_id, status="ACTIVE").first()

    if not license_obj:
        return LicenseResponse(
            valid=False,
            reason="no_license",
        )

    # 1. Verify Ed25519 signature
    payload = verify_license_token(license_obj.signed_payload)
    if payload is None:
        return LicenseResponse(
            valid=False,
            reason="invalid_signature",
        )

    # 2. Verify hardware fingerprint
    if license_obj.hardware_fingerprint != data.hardware_fingerprint:
        return LicenseResponse(
            valid=False,
            reason="fingerprint_mismatch",
        )

    # 3. Verify expiration
    days_left = _days_remaining(license_obj.expires_at)
    if days_left <= 0:
        return LicenseResponse(
            valid=False,
            reason="expired",
        )

    # 4. Verify last validation (30-day offline limit)
    days_since = _days_since(license_obj.last_validated_at)
    if days_since > MAX_OFFLINE_DAYS:
        return LicenseResponse(
            valid=False,
            reason="stale",
        )

    # All checks passed
    now = datetime.now(timezone.utc)
    license_obj.last_validated_at = now
    await license_obj.save()

    return LicenseResponse(
        valid=True,
        license_id=license_obj.license_id,
        license_key=license_obj.license_key,
        license_type=license_obj.license_type,
        activated_at=license_obj.activated_at,
        expires_at=license_obj.expires_at,
        last_validated_at=now,
        max_cameras=license_obj.max_cameras,
        max_people=license_obj.max_people,
        features=license_obj.features,
        status=license_obj.status,
        days_remaining=days_left,
    )


@router.post("/verify-online")
async def verify_online(data: LicenseVerifyOnlineRequest):
    license_obj = await License.filter(user_id=data.user_id, status="ACTIVE").first()

    if not license_obj:
        return LicenseResponse(
            valid=False,
            reason="no_license",
        )

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(
                f"{settings.WEB_URL}/api/licenses/heartbeat",
                json={
                    "licenseId": license_obj.license_id,
                    "hardwareFp": license_obj.hardware_fingerprint,
                },
            )
            web_data = resp.json()
    except Exception:
        raise HTTPException(
            status_code=502, detail="Não foi possível contactar o servidor web"
        )

    if web_data.get("revoked"):
        await license_obj.delete()
        return LicenseResponse(
            valid=False,
            reason="revoked",
        )

    if not web_data.get("valid"):
        await license_obj.delete()
        return LicenseResponse(
            valid=False,
            reason=web_data.get("error", "invalid"),
        )

    now = datetime.now(timezone.utc)
    license_obj.last_validated_at = now
    await license_obj.save()

    return LicenseResponse(
        valid=True,
        license_id=license_obj.license_id,
        license_key=license_obj.license_key,
        license_type=license_obj.license_type,
        activated_at=license_obj.activated_at,
        expires_at=license_obj.expires_at,
        last_validated_at=now,
        max_cameras=license_obj.max_cameras,
        max_people=license_obj.max_people,
        features=license_obj.features,
        status=license_obj.status,
        days_remaining=web_data.get("daysRemaining", 0),
    )


@router.get("/current")
async def get_current_license(user_id: str):
    license_obj = await License.filter(user_id=user_id, status="ACTIVE").first()

    if not license_obj:
        return {"exists": False}

    days_left = _days_remaining(license_obj.expires_at)
    return {
        "exists": True,
        "license_id": license_obj.license_id,
        "license_key": license_obj.license_key,
        "license_type": license_obj.license_type,
        "activated_at": license_obj.activated_at.isoformat(),
        "expires_at": license_obj.expires_at.isoformat(),
        "last_validated_at": (
            license_obj.last_validated_at.isoformat()
            if license_obj.last_validated_at
            else None
        ),
        "max_cameras": license_obj.max_cameras,
        "max_people": license_obj.max_people,
        "features": license_obj.features,
        "status": license_obj.status,
        "days_remaining": days_left,
    }


@router.post("/clear")
async def clear_license(data: LicenseClearRequest):
    deleted = await License.filter(user_id=data.user_id).delete()
    return {"success": True, "deleted": deleted > 0}


@router.post("/features")
async def check_features(data: LicenseFeaturesRequest):
    license_obj = await License.filter(user_id=data.user_id, status="ACTIVE").first()

    if not license_obj:
        return LicenseFeaturesResponse(
            allowed=False,
            reason="no_license",
        )

    days_left = _days_remaining(license_obj.expires_at)
    if days_left <= 0:
        return LicenseFeaturesResponse(
            allowed=False,
            reason="expired",
        )

    return LicenseFeaturesResponse(
        allowed=True,
        max_cameras=license_obj.max_cameras,
        max_people=license_obj.max_people,
        features=license_obj.features,
    )
