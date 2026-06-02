from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class UserProfileBase(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    preferred_zones: Optional[List[str]] = None
    bio: Optional[str] = None
    profile_picture_url: Optional[str] = None

class UserProfileCreate(UserProfileBase):
    pass

class UserProfileUpdate(UserProfileBase):
    pass

class UserProfileOut(UserProfileBase):
    email: str
    created_at: datetime
    updated_at: Optional[datetime] = None

class UserProfileInDB(UserProfileOut):
    pass
