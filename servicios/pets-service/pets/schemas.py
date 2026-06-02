from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class PetBase(BaseModel):
    name: str
    breed: Optional[str] = None
    age: Optional[int] = None
    weight: Optional[float] = None
    notes: Optional[str] = None
    photo_url: Optional[str] = None

class PetCreate(PetBase):
    # Admin-only: permite crear mascota para otro dueño (por email)
    owner_email: Optional[str] = None

class PetUpdate(BaseModel):
    name: Optional[str] = None
    breed: Optional[str] = None
    age: Optional[int] = None
    weight: Optional[float] = None
    notes: Optional[str] = None
    photo_url: Optional[str] = None

class PetOut(PetBase):
    id: int
    owner_email: str
    created_at: datetime

class PetInDB(PetOut):
    pass
