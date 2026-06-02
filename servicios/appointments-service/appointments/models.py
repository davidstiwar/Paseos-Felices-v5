from sqlalchemy import Column, Integer, String, DateTime, Text, Numeric, Enum as SQLEnum
from sqlalchemy.sql import func
from appointments.database import Base
import enum

class AppointmentStatus(str, enum.Enum):
    pending = "pending"
    confirmed = "confirmed"
    in_progress = "in_progress"
    completed = "completed"
    cancelled = "cancelled"

class Appointment(Base):
    __tablename__ = "appointments"
    
    id = Column(Integer, primary_key=True, index=True)
    client_email = Column(String(255), index=True, nullable=False)
    pet_id = Column(Integer, nullable=False)
    service_name = Column(String(255), nullable=False)
    appointment_date = Column(DateTime, nullable=False)
    appointment_time = Column(DateTime, nullable=False)
    notes = Column(Text, nullable=True)
    status = Column(SQLEnum(AppointmentStatus), default=AppointmentStatus.pending, nullable=False)
    price = Column(Numeric(10, 2), nullable=True)
    groomer_email = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class AppointmentNotificationLog(Base):
    """Log para evitar enviar recordatorios duplicados."""

    __tablename__ = "appointment_notification_log"

    id = Column(Integer, primary_key=True, index=True)
    appointment_id = Column(Integer, index=True, nullable=False)
    kind = Column(String(50), index=True, nullable=False)  # appointment_reminder, etc.
    sent_to = Column(String(255), nullable=False)
    sent_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
