from datetime import datetime
from pydantic import BaseModel, EmailStr, field_validator


class Profile(BaseModel):
    profile_id: str
    user_id: str