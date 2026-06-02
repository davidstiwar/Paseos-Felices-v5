from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from enum import Enum

class AppointmentStatus(str, Enum):
    pending = "pending"
    confirmed = "confirmed"
    in_progress = "in_progress"
    completed = "completed"
    cancelled = "cancelled"

class AppointmentBase(BaseModel):
    pet_id: int
    service: str
    date: str          # YYYY-MM-DD
    time: str          # HH:MM
    notes: Optional[str] = None

class AppointmentCreate(AppointmentBase):
    groomer_email: Optional[str] = None  # Opcional: si no se proporciona, el sistema asigna uno

class AppointmentUpdate(BaseModel):
    date: Optional[str] = None
    time: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[AppointmentStatus] = None

class AppointmentOut(AppointmentBase):
    id: int
    client_email: str
    # Campos "enriquecidos" (opcionales) para mostrar nombres en el frontend
    client_name: Optional[str] = None
    pet_name: Optional[str] = None
    pet_breed: Optional[str] = None
    # En pets-service el peso viene como número (float); lo mantenemos como float para evitar 500 por validación
    pet_weight: Optional[float] = None
    pet_photo_url: Optional[str] = None
    status: AppointmentStatus
    price: Optional[float] = None
    groomer_email: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

class AppointmentInDB(AppointmentOut):
    pass
