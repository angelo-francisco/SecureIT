from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class LicenseStoreRequest(BaseModel):
    license_id: str
    user_id: str
    license_key: str
    license_type: str
    activated_at: datetime
    expires_at: datetime
    hardware_fingerprint: str
    signed_payload: str
    public_key: str
    signature: str
    max_cameras: int = -1
    max_people: int = -1
    features: list[str] = []
    status: str = "ACTIVE"


class LicenseVerifyRequest(BaseModel):
    user_id: str
    hardware_fingerprint: str


class LicenseFeaturesRequest(BaseModel):
    user_id: str


class LicenseClearRequest(BaseModel):
    user_id: str


class LicenseResponse(BaseModel):
    valid: bool
    license_id: Optional[str] = None
    license_key: Optional[str] = None
    license_type: Optional[str] = None
    activated_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    last_validated_at: Optional[datetime] = None
    max_cameras: int = -1
    max_people: int = -1
    features: list[str] = []
    status: str = "ACTIVE"
    days_remaining: int = 0
    reason: Optional[str] = None


class LicenseFeaturesResponse(BaseModel):
    allowed: bool
    reason: Optional[str] = None
    max_cameras: int = -1
    max_people: int = -1
    features: list[str] = []
