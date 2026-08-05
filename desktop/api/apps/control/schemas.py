from pydantic import BaseModel


class Profile(BaseModel):
    profile_id: str
    user_id: str
