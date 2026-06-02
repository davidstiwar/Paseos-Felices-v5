from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from enum import Enum

class ServiceCategory(str, Enum):
    paseo = "paseo"
    grooming = "grooming"
    entrenamiento = "entrenamiento"
    cuidado_casa = "cuidado_casa"
    otro = "otro"

class ServiceBase(BaseModel):
    name: str
    description: Optional[str] = None
    category: ServiceCategory
    base_price: float
    duration_minutes: int
    is_active: bool = True

class ServiceCreate(ServiceBase):
    pass

class ServiceUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[ServiceCategory] = None
    base_price: Optional[float] = None
    duration_minutes: Optional[int] = None
    is_active: Optional[bool] = None

class ServiceOut(ServiceBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

class ServiceInDB(ServiceOut):
    pass
