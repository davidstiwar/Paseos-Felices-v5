from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from notifications.database import get_db
from .models import Notification, SecureMessage
from .schemas import NotificationCreate, NotificationOut, NotificationType, MessageCreate, MessageOut
from core.security import get_current_user

router = APIRouter(prefix="/notifications", tags=["notifications"])

@router.post("/", response_model=NotificationOut, status_code=status.HTTP_201_CREATED)
async def create_notification(
    notification_in: NotificationCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create notification (for authenticated users or internal with token)"""
    return await _create_notification(notification_in, db)

@router.post("/internal", response_model=NotificationOut, status_code=status.HTTP_201_CREATED)
async def create_internal_notification(notification_in: NotificationCreate, db: Session = Depends(get_db)):
    """Internal endpoint for other microservices (no auth required)"""
    return await _create_notification(notification_in, db)

async def _create_notification(notification_in: NotificationCreate, db: Session):
    notif = Notification(
        user_email=notification_in.user_email,
        type=notification_in.type,
        title=notification_in.title,
        message=notification_in.message,
        is_read=False,
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)
    return NotificationOut(
        id=notif.id,
        user_email=notif.user_email,
        type=notif.type.value if hasattr(notif.type, "value") else str(notif.type),
        title=notif.title,
        message=notif.message,
        is_read=notif.is_read,
        created_at=notif.created_at,
    )

@router.get("/", response_model=List[NotificationOut])
async def get_my_notifications(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    items = (
        db.query(Notification)
        .filter(Notification.user_email == current_user["email"])
        .order_by(Notification.created_at.desc())
        .limit(200)
        .all()
    )
    return [
        NotificationOut(
            id=n.id,
            user_email=n.user_email,
            type=n.type.value if hasattr(n.type, "value") else str(n.type),
            title=n.title,
            message=n.message,
            is_read=n.is_read,
            created_at=n.created_at,
        )
        for n in items
    ]

@router.get("/unread-count")
async def get_unread_count(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    count = (
        db.query(Notification)
        .filter(Notification.user_email == current_user["email"], Notification.is_read == False)  # noqa: E712
        .count()
    )
    return {"unread_count": count}

@router.put("/{notification_id}/read", response_model=NotificationOut)
async def mark_as_read(notification_id: int, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    notif = db.query(Notification).filter(Notification.id == notification_id).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notificación no encontrada")

    if notif.user_email != current_user["email"]:
        raise HTTPException(status_code=403, detail="No tienes permiso")

    notif.is_read = True
    db.add(notif)
    db.commit()
    db.refresh(notif)
    return NotificationOut(
        id=notif.id,
        user_email=notif.user_email,
        type=notif.type.value if hasattr(notif.type, "value") else str(notif.type),
        title=notif.title,
        message=notif.message,
        is_read=notif.is_read,
        created_at=notif.created_at,
    )

@router.delete("/{notification_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_notification(notification_id: int, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    notif = db.query(Notification).filter(Notification.id == notification_id).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notificación no encontrada")

    if notif.user_email != current_user["email"]:
        raise HTTPException(status_code=403, detail="No tienes permiso")

    db.delete(notif)
    db.commit()
    return None


# ==========================
# Mensajería segura (básica)
# ==========================

@router.post("/messages", response_model=MessageOut, status_code=status.HTTP_201_CREATED)
async def send_message(payload: MessageCreate, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    msg = SecureMessage(
        sender_email=current_user["email"],
        recipient_email=payload.recipient_email,
        subject=payload.subject,
        body=payload.body,
        is_read=False,
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)

    # Notificación al receptor (best-effort)
    try:
        notif_in = NotificationCreate(
            user_email=payload.recipient_email,
            type=NotificationType.general,
            title="Nuevo mensaje",
            message=(payload.subject or "Tienes un nuevo mensaje"),
        )
        await _create_notification(notif_in, db)
    except Exception:
        pass

    return MessageOut(
        id=msg.id,
        sender_email=msg.sender_email,
        recipient_email=msg.recipient_email,
        subject=msg.subject,
        body=msg.body,
        is_read=msg.is_read,
        created_at=msg.created_at,
    )


@router.get("/messages/inbox", response_model=List[MessageOut])
async def inbox(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    items = (
        db.query(SecureMessage)
        .filter(SecureMessage.recipient_email == current_user["email"])
        .order_by(SecureMessage.created_at.desc())
        .limit(200)
        .all()
    )
    return [
        MessageOut(
            id=m.id,
            sender_email=m.sender_email,
            recipient_email=m.recipient_email,
            subject=m.subject,
            body=m.body,
            is_read=m.is_read,
            created_at=m.created_at,
        )
        for m in items
    ]


@router.put("/messages/{message_id}/read", response_model=MessageOut)
async def mark_message_read(message_id: int, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    msg = db.query(SecureMessage).filter(SecureMessage.id == message_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Mensaje no encontrado")
    if msg.recipient_email != current_user["email"]:
        raise HTTPException(status_code=403, detail="No tienes permiso")
    msg.is_read = True
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return MessageOut(
        id=msg.id,
        sender_email=msg.sender_email,
        recipient_email=msg.recipient_email,
        subject=msg.subject,
        body=msg.body,
        is_read=msg.is_read,
        created_at=msg.created_at,
    )
