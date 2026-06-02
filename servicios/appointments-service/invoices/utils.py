from __future__ import annotations

from decimal import Decimal, ROUND_HALF_UP
from typing import Optional

from sqlalchemy.orm import Session

from invoices.models import CommissionSetting, Invoice, InvoiceStatus


DEFAULT_GROOMER_PERCENTAGE = 80
DEFAULT_PLATFORM_PERCENTAGE = 20


def _q2(value: Decimal) -> Decimal:
    return value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def ensure_active_commission_setting(db: Session) -> CommissionSetting:
    """
    Retorna la configuración activa. Si no existe, crea la inicial (80/20).
    """
    setting = (
        db.query(CommissionSetting)
        .filter(CommissionSetting.is_active == 1)
        .order_by(CommissionSetting.id.desc())
        .first()
    )
    if setting:
        return setting

    setting = CommissionSetting(
        groomer_percentage=DEFAULT_GROOMER_PERCENTAGE,
        platform_percentage=DEFAULT_PLATFORM_PERCENTAGE,
        is_active=1,
    )
    db.add(setting)
    db.commit()
    db.refresh(setting)
    return setting


def create_invoice_for_appointment(
    db: Session,
    *,
    appointment_id: int,
    client_email: str,
    pet_id: int,
    groomer_email: Optional[str],
    service_name: str,
    price: Optional[float],
) -> Invoice:
    """
    Crea una factura en estado pending para la cita (si no existe).
    La factura persiste el % vigente en ese momento (histórico).
    """
    existing = db.query(Invoice).filter(Invoice.appointment_id == appointment_id).first()
    if existing:
        return existing

    setting = ensure_active_commission_setting(db)

    subtotal = Decimal(str(price or 0))
    total = subtotal

    groomer_amount = _q2(total * Decimal(setting.groomer_percentage) / Decimal(100))
    platform_amount = _q2(total * Decimal(setting.platform_percentage) / Decimal(100))

    inv = Invoice(
        invoice_number=None,  # se setea luego con el id
        appointment_id=appointment_id,
        client_email=client_email,
        pet_id=pet_id,
        groomer_email=groomer_email,
        service_name=service_name,
        subtotal=_q2(subtotal),
        total=_q2(total),
        status=InvoiceStatus.pending,
        groomer_percentage=setting.groomer_percentage,
        platform_percentage=setting.platform_percentage,
        groomer_amount=groomer_amount,
        platform_amount=platform_amount,
    )
    db.add(inv)
    db.commit()
    db.refresh(inv)

    # Número de factura basado en id (padding), ej: 000123
    inv.invoice_number = f"{inv.id:06d}"
    db.commit()
    db.refresh(inv)
    return inv

