from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class ReviewBase(BaseModel):
    groomer_id: int
    rating: int = Field(ge=1, le=5)
    comment: Optional[str] = None

class ReviewCreate(ReviewBase):
    appointment_id: Optional[int] = None  # Opcional por ahora

class ReviewUpdate(BaseModel):
    rating: Optional[int] = Field(default=None, ge=1, le=5)
    comment: Optional[str] = None

class ReviewOut(ReviewBase):
    id: int
    client_email: str
    appointment_id: Optional[int] = None
    created_at: datetime

class ReviewInDB(ReviewOut):
    pass
