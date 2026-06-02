from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime

class GroomerBase(BaseModel):
    full_name: str
    phone: str
    bio: Optional[str] = None
    photo: Optional[str] = None
    is_active: bool = True

class GroomerCreate(GroomerBase):
    pass

class GroomerUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    bio: Optional[str] = None
    photo: Optional[str] = None
    is_active: Optional[bool] = None

class ServiceInfo(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    category: str
    base_price: float
    duration_minutes: int

class GroomerOut(GroomerBase):
    id: int
    email: str
    rating: float = 0.0
    created_at: datetime
    updated_at: Optional[datetime] = None
    specialties: List[str] = []
    services: List[ServiceInfo] = []

class GroomerInDB(GroomerOut):
    pass
