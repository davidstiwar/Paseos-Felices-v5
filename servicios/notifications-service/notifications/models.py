import enum

from sqlalchemy import Column, Integer, String, DateTime, Boolean, Enum as SQLEnum, Text, Index
from sqlalchemy.sql import func

from notifications.database import Base


class NotificationType(str, enum.Enum):
    appointment_requested = "appointment_requested"
    appointment_confirmed = "appointment_confirmed"
    appointment_reminder = "appointment_reminder"
    appointment_cancelled = "appointment_cancelled"
    review_request = "review_request"
    new_appointment = "new_appointment"
    general = "general"


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_email = Column(String(255), index=True, nullable=False)
    type = Column(SQLEnum(NotificationType), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)

    is_read = Column(Boolean, default=False, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    __table_args__ = (
        Index("idx_notifications_user_created", "user_email", "created_at"),
    )


class SecureMessage(Base):
    """
    Mensajería básica "segura" (token/JWT) entre usuarios.
    Nota: es un inbox sencillo, no un chat en tiempo real.
    """

    __tablename__ = "secure_messages"

    id = Column(Integer, primary_key=True, index=True)
    sender_email = Column(String(255), index=True, nullable=False)
    recipient_email = Column(String(255), index=True, nullable=False)
    subject = Column(String(255), nullable=True)
    body = Column(Text, nullable=False)

    is_read = Column(Boolean, default=False, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    __table_args__ = (
        Index("idx_messages_recipient_created", "recipient_email", "created_at"),
        Index("idx_messages_sender_created", "sender_email", "created_at"),
    )

