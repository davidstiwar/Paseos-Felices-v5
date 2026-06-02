from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from enum import Enum

class NotificationType(str, Enum):
    appointment_requested = "appointment_requested"
    appointment_confirmed = "appointment_confirmed"
    appointment_reminder = "appointment_reminder"
    appointment_cancelled = "appointment_cancelled"
    review_request = "review_request"
    new_appointment = "new_appointment"
    general = "general"

class NotificationBase(BaseModel):
    user_email: str
    type: NotificationType
    title: str
    message: str

class NotificationCreate(NotificationBase):
    pass

class NotificationOut(NotificationBase):
    id: int
    is_read: bool = False
    created_at: datetime

class NotificationInDB(NotificationOut):
    pass


class MessageCreate(BaseModel):
    recipient_email: str
    subject: Optional[str] = None
    body: str


class MessageOut(BaseModel):
    id: int
    sender_email: str
    recipient_email: str
    subject: Optional[str] = None
    body: str
    is_read: bool = False
    created_at: datetime
