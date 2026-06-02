from __future__ import annotations

from datetime import datetime
from decimal import Decimal
import hashlib
import json
import time
from typing import List, Optional

import httpx
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import Response
from sqlalchemy.orm import Session

from appointments.database import get_db
from core.config import settings
from core.security import get_current_user
from invoices.models import (
    Invoice,
    InvoiceStatus,
    Payment,
    PaymentGatewayTransaction,
    CommissionSetting,
    CommissionChangeAudit,
)
from invoices.schemas import (
    InvoiceOut,
    InvoiceDetailOut,
    PaymentOut,
    PaymentGatewayTransactionOut,
    MarkPaidIn,
    CommissionSettingOut,
    CommissionUpdateIn,
    CommissionAuditOut,
    FinancialSummaryOut,
    FinancialByGroomerOut,
    GroomerIncomeOut,
    FinancialByServiceOut,
    ServiceIncomeOut,
)
from invoices.utils import ensure_active_commission_setting
from invoices.pdf import build_invoice_pdf


router = APIRouter(tags=["invoices"])


async def _get_user_name(email: str) -> Optional[str]:
    for base_url in ["http://localhost:8000", "http://auth-service:8000"]:
        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                response = await client.get(f"{base_url}/auth/internal/users/{email}")
                if response.status_code == 200:
                    user_data = response.json()
                    return user_data.get("nombre_completo") or user_data.get("full_name")
        except Exception:
            continue
    return None


async def _get_pet_name(pet_id: int) -> Optional[str]:
    for base_url in ["http://localhost:3022", "http://pets-service:3022"]:
        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                response = await client.get(f"{base_url}/pets/internal/{pet_id}")
                if response.status_code == 200:
                    data = response.json()
                    return data.get("name")
        except Exception:
            continue
    return None


def _role_is_admin(user: dict) -> bool:
    return user.get("role") == "admin"


def _role_is_groomer(user: dict) -> bool:
    return user.get("role") == "groomer"


def _can_view_invoice(user: dict, inv: Invoice) -> bool:
    if _role_is_admin(user):
        return True
    if user.get("email") == inv.client_email:
        return True
    if user.get("email") and inv.groomer_email and user.get("email") == inv.groomer_email:
        return True
    return False


def _to_float(value) -> float:
    return float(value) if value is not None else 0.0


@router.get("/invoices/me", response_model=List[InvoiceOut])
async def my_invoices(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    invoices = (
        db.query(Invoice)
        .filter(Invoice.client_email == current_user["email"])
        .order_by(Invoice.id.desc())
        .all()
    )
    items: List[InvoiceOut] = []
    pet_cache = {}
    for inv in invoices:
        pet_name = pet_cache.get(inv.pet_id)
        if pet_name is None:
            pet_name = await _get_pet_name(inv.pet_id)
            pet_cache[inv.pet_id] = pet_name
        items.append(
            InvoiceOut(
                id=inv.id,
                invoice_number=inv.invoice_number or f"{inv.id:06d}",
                appointment_id=inv.appointment_id,
                client_email=inv.client_email,
                pet_id=inv.pet_id,
                pet_name=pet_name,
                groomer_email=inv.groomer_email,
                service_name=inv.service_name,
                total=_to_float(inv.total),
                status=inv.status.value if hasattr(inv.status, "value") else inv.status,
                issued_at=inv.issued_at,
                paid_at=inv.paid_at,
                cancelled_at=inv.cancelled_at,
            )
        )
    return items


@router.get("/invoices/groomer", response_model=List[InvoiceOut])
async def groomer_invoices(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    if not _role_is_groomer(current_user) and not _role_is_admin(current_user):
        raise HTTPException(status_code=403, detail="No autorizado")

    invoices = (
        db.query(Invoice)
        .filter(Invoice.groomer_email == current_user["email"])
        .order_by(Invoice.id.desc())
        .all()
    )
    items: List[InvoiceOut] = []
    client_cache = {}
    pet_cache = {}
    for inv in invoices:
        client_name = client_cache.get(inv.client_email)
        if client_name is None:
            client_name = await _get_user_name(inv.client_email)
            client_cache[inv.client_email] = client_name

        pet_name = pet_cache.get(inv.pet_id)
        if pet_name is None:
            pet_name = await _get_pet_name(inv.pet_id)
            pet_cache[inv.pet_id] = pet_name

        items.append(
            InvoiceOut(
                id=inv.id,
                invoice_number=inv.invoice_number or f"{inv.id:06d}",
                appointment_id=inv.appointment_id,
                client_email=inv.client_email,
                client_name=client_name,
                pet_id=inv.pet_id,
                pet_name=pet_name,
                groomer_email=inv.groomer_email,
                service_name=inv.service_name,
                total=_to_float(inv.total),
                status=inv.status.value if hasattr(inv.status, "value") else inv.status,
                issued_at=inv.issued_at,
                paid_at=inv.paid_at,
                cancelled_at=inv.cancelled_at,
                groomer_percentage=inv.groomer_percentage,
                platform_percentage=inv.platform_percentage,
                groomer_amount=_to_float(inv.groomer_amount),
                platform_amount=_to_float(inv.platform_amount),
            )
        )
    return items


@router.get("/invoices", response_model=List[InvoiceOut])
async def list_invoices(
    status_filter: Optional[str] = None,
    client_email: Optional[str] = None,
    groomer_email: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not _role_is_admin(current_user):
        raise HTTPException(status_code=403, detail="No autorizado")

    q = db.query(Invoice)
    if status_filter in {"pending", "paid", "cancelled"}:
        q = q.filter(Invoice.status == InvoiceStatus(status_filter))
    if client_email:
        q = q.filter(Invoice.client_email == client_email)
    if groomer_email:
        q = q.filter(Invoice.groomer_email == groomer_email)

    invoices = q.order_by(Invoice.id.desc()).all()
    items: List[InvoiceOut] = []
    client_cache = {}
    pet_cache = {}
    groomer_cache = {}

    for inv in invoices:
        client_name = client_cache.get(inv.client_email)
        if client_name is None:
            client_name = await _get_user_name(inv.client_email)
            client_cache[inv.client_email] = client_name

        pet_name = pet_cache.get(inv.pet_id)
        if pet_name is None:
            pet_name = await _get_pet_name(inv.pet_id)
            pet_cache[inv.pet_id] = pet_name

        groomer_name = None
        if inv.groomer_email:
            groomer_name = groomer_cache.get(inv.groomer_email)
            if groomer_name is None:
                groomer_name = await _get_user_name(inv.groomer_email)
                groomer_cache[inv.groomer_email] = groomer_name

        items.append(
            InvoiceOut(
                id=inv.id,
                invoice_number=inv.invoice_number or f"{inv.id:06d}",
                appointment_id=inv.appointment_id,
                client_email=inv.client_email,
                client_name=client_name,
                pet_id=inv.pet_id,
                pet_name=pet_name,
                groomer_email=inv.groomer_email,
                groomer_name=groomer_name,
                service_name=inv.service_name,
                total=_to_float(inv.total),
                status=inv.status.value if hasattr(inv.status, "value") else inv.status,
                issued_at=inv.issued_at,
                paid_at=inv.paid_at,
                cancelled_at=inv.cancelled_at,
                groomer_percentage=inv.groomer_percentage,
                platform_percentage=inv.platform_percentage,
                groomer_amount=_to_float(inv.groomer_amount),
                platform_amount=_to_float(inv.platform_amount),
            )
        )
    return items


@router.get("/invoices/{invoice_id}", response_model=InvoiceDetailOut)
async def get_invoice(invoice_id: int, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    inv = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not inv or not _can_view_invoice(current_user, inv):
        raise HTTPException(status_code=404, detail="Factura no encontrada")

    client_name = await _get_user_name(inv.client_email)
    groomer_name = await _get_user_name(inv.groomer_email) if inv.groomer_email else None
    pet_name = await _get_pet_name(inv.pet_id)

    show_internal = _role_is_admin(current_user) or (current_user.get("email") == inv.groomer_email)

    payments_out: Optional[List[PaymentOut]] = None
    if _role_is_admin(current_user):
        payments = db.query(Payment).filter(Payment.invoice_id == inv.id).order_by(Payment.id.desc()).all()
        payments_out = [
            PaymentOut(
                id=p.id,
                invoice_id=p.invoice_id,
                method=p.method.value if hasattr(p.method, "value") else str(p.method),
                amount=_to_float(p.amount),
                received_by_admin_email=p.received_by_admin_email,
                received_at=p.received_at,
            )
            for p in payments
        ]

    gateway_out: Optional[List[PaymentGatewayTransactionOut]] = None
    gateway_txs = (
        db.query(PaymentGatewayTransaction)
        .filter(PaymentGatewayTransaction.invoice_id == inv.id)
        .order_by(PaymentGatewayTransaction.id.desc())
        .all()
    )
    if gateway_txs:
        gateway_out = [
            PaymentGatewayTransactionOut(
                id=t.id,
                invoice_id=t.invoice_id,
                provider=t.provider,
                reference_code=t.reference_code,
                status=t.status,
                transaction_id=t.transaction_id,
                amount=_to_float(t.amount),
                currency=t.currency,
                created_at=t.created_at,
                updated_at=t.updated_at,
            )
            for t in gateway_txs
        ]

    return InvoiceDetailOut(
        id=inv.id,
        invoice_number=inv.invoice_number or f"{inv.id:06d}",
        appointment_id=inv.appointment_id,
        client_email=inv.client_email,
        client_name=client_name,
        pet_id=inv.pet_id,
        pet_name=pet_name,
        groomer_email=inv.groomer_email,
        groomer_name=groomer_name,
        service_name=inv.service_name,
        subtotal=_to_float(inv.subtotal),
        total=_to_float(inv.total),
        status=inv.status.value if hasattr(inv.status, "value") else inv.status,
        issued_at=inv.issued_at,
        paid_at=inv.paid_at,
        cancelled_at=inv.cancelled_at,
        groomer_percentage=inv.groomer_percentage if show_internal else None,
        platform_percentage=inv.platform_percentage if show_internal else None,
        groomer_amount=_to_float(inv.groomer_amount) if show_internal else None,
        platform_amount=_to_float(inv.platform_amount) if show_internal else None,
        payments=payments_out,
        gateway_transactions=gateway_out,
    )


@router.get("/invoices/{invoice_id}/pdf")
async def get_invoice_pdf(invoice_id: int, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    inv = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not inv or not _can_view_invoice(current_user, inv):
        raise HTTPException(status_code=404, detail="Factura no encontrada")

    payload = {
        "invoice_number": inv.invoice_number or f"{inv.id:06d}",
        "issued_at": inv.issued_at.strftime("%Y-%m-%d %H:%M") if inv.issued_at else "",
        "client_email": inv.client_email,
        "client_name": await _get_user_name(inv.client_email),
        "pet_id": inv.pet_id,
        "pet_name": await _get_pet_name(inv.pet_id),
        "groomer_email": inv.groomer_email,
        "groomer_name": await _get_user_name(inv.groomer_email) if inv.groomer_email else None,
        "service_name": inv.service_name,
        "total": _to_float(inv.total),
        "status": (inv.status.value if hasattr(inv.status, "value") else inv.status),
    }

    pdf_bytes = build_invoice_pdf(payload)
    filename = f"factura_{payload['invoice_number']}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.post("/invoices/{invoice_id}/mark-paid", response_model=InvoiceDetailOut)
async def mark_invoice_paid(
    invoice_id: int,
    payload: MarkPaidIn,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not _role_is_admin(current_user):
        raise HTTPException(status_code=403, detail="No autorizado")

    inv = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Factura no encontrada")
    if inv.status == InvoiceStatus.cancelled:
        raise HTTPException(status_code=400, detail="No puedes pagar una factura cancelada")

    inv.status = InvoiceStatus.paid
    inv.paid_at = datetime.utcnow()
    db.add(inv)

    amount = Decimal(str(payload.amount if payload.amount is not None else inv.total))
    payment = Payment(
        invoice_id=inv.id,
        amount=amount,
        received_by_admin_email=current_user["email"],
    )
    db.add(payment)
    db.commit()
    db.refresh(inv)

    # Reusar endpoint detalle para respuesta uniforme
    return await get_invoice(invoice_id, current_user=current_user, db=db)


@router.post("/invoices/{invoice_id}/cancel", response_model=InvoiceDetailOut)
async def cancel_invoice(invoice_id: int, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    if not _role_is_admin(current_user):
        raise HTTPException(status_code=403, detail="No autorizado")

    inv = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Factura no encontrada")

    inv.status = InvoiceStatus.cancelled
    inv.cancelled_at = datetime.utcnow()
    db.commit()
    db.refresh(inv)
    return await get_invoice(invoice_id, current_user=current_user, db=db)


# ======================
# PayU (gateway)
# ======================

def _payu_md5_signature(api_key: str, merchant_id: str, reference_code: str, amount_str: str, currency: str) -> str:
    """
    Firma básica PayU (formulario de pago):
    MD5(ApiKey~merchantId~referenceCode~amount~currency)
    """
    raw = f"{api_key}~{merchant_id}~{reference_code}~{amount_str}~{currency}"
    return hashlib.md5(raw.encode("utf-8")).hexdigest()


@router.post("/invoices/{invoice_id}/payu/init")
async def payu_init_payment(
    invoice_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Inicia un pago PayU para una factura (retorna URL + campos para POST).
    Requiere autenticación y permisos para ver la factura.
    """
    inv = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not inv or not _can_view_invoice(current_user, inv):
        raise HTTPException(status_code=404, detail="Factura no encontrada")
    if inv.status == InvoiceStatus.cancelled:
        raise HTTPException(status_code=400, detail="No puedes pagar una factura cancelada")
    if inv.status == InvoiceStatus.paid:
        raise HTTPException(status_code=400, detail="La factura ya está pagada")

    if not settings.PAYU_MERCHANT_ID or not settings.PAYU_ACCOUNT_ID or not settings.PAYU_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="PayU no está configurado. Define PAYU_MERCHANT_ID, PAYU_ACCOUNT_ID y PAYU_API_KEY en el .env del servicio.",
        )

    invoice_number = inv.invoice_number or f"{inv.id:06d}"
    reference_code = f"INV-{invoice_number}-{int(time.time())}"
    amount_str = f"{_to_float(inv.total):.2f}"
    currency = settings.PAYU_CURRENCY or "COP"
    signature = _payu_md5_signature(settings.PAYU_API_KEY, settings.PAYU_MERCHANT_ID, reference_code, amount_str, currency)

    tx = PaymentGatewayTransaction(
        invoice_id=inv.id,
        provider="payu",
        reference_code=reference_code,
        status="initiated",
        transaction_id=None,
        amount=Decimal(amount_str),
        currency=currency,
        raw_payload=json.dumps({"init_by": current_user.get("email")}, ensure_ascii=False),
    )
    db.add(tx)
    db.commit()
    db.refresh(tx)

    description = f"Paseos Felices - Factura {invoice_number}"
    fields = {
        "merchantId": settings.PAYU_MERCHANT_ID,
        "accountId": settings.PAYU_ACCOUNT_ID,
        "description": description,
        "referenceCode": reference_code,
        "amount": amount_str,
        "tax": "0",
        "taxReturnBase": "0",
        "currency": currency,
        "signature": signature,
        "test": str(int(settings.PAYU_TEST)),
        "buyerEmail": inv.client_email,
        "responseUrl": settings.PAYU_RESPONSE_URL,
        "confirmationUrl": settings.PAYU_CONFIRMATION_URL,
    }

    return {
        "payment_url": settings.PAYU_PAYMENT_URL,
        "fields": fields,
        "gateway_transaction_id": tx.id,
    }


@router.post("/invoices/payu/confirmation")
async def payu_confirmation(request: Request, db: Session = Depends(get_db)):
    """
    Endpoint de confirmación PayU (server-to-server).
    PayU envía datos por formulario (application/x-www-form-urlencoded).
    """
    form = await request.form()
    data = {k: str(v) for k, v in form.items()}

    reference = data.get("reference_sale") or data.get("referenceCode") or data.get("reference_sale")
    state = (data.get("state_pol") or data.get("state") or "").upper()
    currency = data.get("currency") or settings.PAYU_CURRENCY or "COP"
    value = data.get("value") or data.get("amount") or "0"
    sign = (data.get("sign") or data.get("signature") or "").lower()
    merchant_id = str(data.get("merchant_id") or data.get("merchantId") or settings.PAYU_MERCHANT_ID)

    if not reference:
        return {"ok": True, "ignored": True, "reason": "missing_reference"}

    # Validación de firma (tolerante a formato de valor)
    if settings.PAYU_API_KEY and sign:
        # PayU suele firmar value con 1 decimal. Probamos 1 y 2 decimales.
        try:
            v_float = float(value)
        except Exception:
            v_float = 0.0

        candidates = [f"{v_float:.1f}", f"{v_float:.2f}", value]
        valid = False
        for v in candidates:
            raw = f"{settings.PAYU_API_KEY}~{merchant_id}~{reference}~{v}~{currency}~{state}"
            if hashlib.md5(raw.encode("utf-8")).hexdigest().lower() == sign:
                valid = True
                break
        if not valid:
            # Guardar igual para depurar, pero marcar error
            tx = db.query(PaymentGatewayTransaction).filter(PaymentGatewayTransaction.reference_code == reference).first()
            if tx:
                tx.status = "invalid_signature"
                tx.raw_payload = json.dumps(data, ensure_ascii=False)
                db.add(tx)
                db.commit()
            return {"ok": False, "error": "invalid_signature"}

    tx = db.query(PaymentGatewayTransaction).filter(PaymentGatewayTransaction.reference_code == reference).first()
    if not tx:
        return {"ok": True, "ignored": True, "reason": "unknown_reference"}

    normalized = "pending"
    if state in {"APPROVED", "4"}:
        normalized = "approved"
    elif state in {"DECLINED", "6"}:
        normalized = "declined"
    elif state in {"EXPIRED", "5"}:
        normalized = "expired"
    elif state in {"ERROR", "104"}:
        normalized = "error"

    tx.status = normalized
    tx.transaction_id = data.get("transaction_id") or data.get("transactionId") or tx.transaction_id
    tx.raw_payload = json.dumps(data, ensure_ascii=False)
    db.add(tx)

    # Si fue aprobado: marcar factura como pagada + registrar Payment interno
    if normalized == "approved":
        inv = db.query(Invoice).filter(Invoice.id == tx.invoice_id).first()
        if inv and inv.status != InvoiceStatus.paid:
            inv.status = InvoiceStatus.paid
            inv.paid_at = datetime.utcnow()
            db.add(inv)

            try:
                amount = Decimal(str(float(value)))
            except Exception:
                amount = Decimal(str(inv.total))

            payment = Payment(
                invoice_id=inv.id,
                amount=amount,
                received_by_admin_email="PAYU",
            )
            db.add(payment)

    db.commit()
    return {"ok": True}


# ======================
# Comisiones (admin)
# ======================

@router.get("/commissions/current", response_model=CommissionSettingOut)
async def get_commissions_current(db: Session = Depends(get_db)):
    setting = ensure_active_commission_setting(db)
    return CommissionSettingOut(
        groomer_percentage=setting.groomer_percentage,
        platform_percentage=setting.platform_percentage,
        updated_at=setting.updated_at,
    )


@router.put("/commissions", response_model=CommissionSettingOut)
async def update_commissions(
    data: CommissionUpdateIn,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not _role_is_admin(current_user):
        raise HTTPException(status_code=403, detail="No autorizado")

    if data.groomer_percentage + data.platform_percentage != 100:
        raise HTTPException(status_code=400, detail="La suma de porcentajes debe ser 100%")

    current = ensure_active_commission_setting(db)

    # Desactivar actual
    current.is_active = 0
    db.add(current)

    # Crear nuevo
    new_setting = CommissionSetting(
        groomer_percentage=data.groomer_percentage,
        platform_percentage=data.platform_percentage,
        is_active=1,
    )
    db.add(new_setting)

    audit = CommissionChangeAudit(
        previous_groomer_percentage=current.groomer_percentage,
        previous_platform_percentage=current.platform_percentage,
        new_groomer_percentage=data.groomer_percentage,
        new_platform_percentage=data.platform_percentage,
        changed_by_admin_email=current_user["email"],
        reason=data.reason,
    )
    db.add(audit)

    db.commit()
    db.refresh(new_setting)

    return CommissionSettingOut(
        groomer_percentage=new_setting.groomer_percentage,
        platform_percentage=new_setting.platform_percentage,
        updated_at=new_setting.updated_at,
    )


@router.get("/commissions/history", response_model=List[CommissionAuditOut])
async def commissions_history(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    if not _role_is_admin(current_user):
        raise HTTPException(status_code=403, detail="No autorizado")

    items = db.query(CommissionChangeAudit).order_by(CommissionChangeAudit.id.desc()).limit(200).all()
    return [
        CommissionAuditOut(
            id=i.id,
            previous_groomer_percentage=i.previous_groomer_percentage,
            previous_platform_percentage=i.previous_platform_percentage,
            new_groomer_percentage=i.new_groomer_percentage,
            new_platform_percentage=i.new_platform_percentage,
            changed_by_admin_email=i.changed_by_admin_email,
            reason=i.reason,
            changed_at=i.changed_at,
        )
        for i in items
    ]


# ======================
# Reportes financieros
# ======================

@router.get("/financial/summary", response_model=FinancialSummaryOut)
async def financial_summary(
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not _role_is_admin(current_user):
        raise HTTPException(status_code=403, detail="No autorizado")

    q = db.query(Invoice)
    # Filtrar por rango usando issued_at (fecha de emisión)
    try:
        if from_date:
            fd = datetime.fromisoformat(from_date)
            q = q.filter(Invoice.issued_at >= fd)
        if to_date:
            td = datetime.fromisoformat(to_date)
            q = q.filter(Invoice.issued_at <= td)
    except Exception:
        raise HTTPException(status_code=422, detail="Formato de fecha inválido. Usa YYYY-MM-DD.")

    invoices = q.all()
    total_facturado = sum((_to_float(i.total) for i in invoices))
    total_pendiente = sum((_to_float(i.total) for i in invoices if i.status == InvoiceStatus.pending))
    total_pagado = sum((_to_float(i.total) for i in invoices if i.status == InvoiceStatus.paid))
    total_cancelado = sum((_to_float(i.total) for i in invoices if i.status == InvoiceStatus.cancelled))

    ingreso_plataforma = sum((_to_float(i.platform_amount) for i in invoices if i.status == InvoiceStatus.paid))
    ingreso_groomers = sum((_to_float(i.groomer_amount) for i in invoices if i.status == InvoiceStatus.paid))

    return FinancialSummaryOut(
        total_facturado=total_facturado,
        total_pendiente=total_pendiente,
        total_pagado=total_pagado,
        total_cancelado=total_cancelado,
        ingreso_plataforma=ingreso_plataforma,
        ingreso_groomers=ingreso_groomers,
    )


@router.get("/financial/by-groomer", response_model=FinancialByGroomerOut)
async def financial_by_groomer(
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not _role_is_admin(current_user):
        raise HTTPException(status_code=403, detail="No autorizado")

    q = db.query(Invoice).filter(Invoice.groomer_email.isnot(None))
    try:
        if from_date:
            fd = datetime.fromisoformat(from_date)
            q = q.filter(Invoice.issued_at >= fd)
        if to_date:
            td = datetime.fromisoformat(to_date)
            q = q.filter(Invoice.issued_at <= td)
    except Exception:
        raise HTTPException(status_code=422, detail="Formato de fecha inválido. Usa YYYY-MM-DD.")

    invoices = q.all()
    by = {}
    for inv in invoices:
        email = inv.groomer_email
        if email not in by:
            by[email] = {"total_facturado": 0.0, "total_pagado": 0.0, "ingreso_estimado": 0.0}
        by[email]["total_facturado"] += _to_float(inv.total)
        if inv.status == InvoiceStatus.paid:
            by[email]["total_pagado"] += _to_float(inv.total)
        # Estimado: suma de parte groomer en facturas no canceladas
        if inv.status != InvoiceStatus.cancelled:
            by[email]["ingreso_estimado"] += _to_float(inv.groomer_amount)

    items = [
        GroomerIncomeOut(
            groomer_email=email,
            total_facturado=vals["total_facturado"],
            total_pagado=vals["total_pagado"],
            ingreso_estimado=vals["ingreso_estimado"],
        )
        for email, vals in sorted(by.items(), key=lambda x: x[1]["ingreso_estimado"], reverse=True)
    ]
    return FinancialByGroomerOut(items=items)


@router.get("/financial/by-service", response_model=FinancialByServiceOut)
async def financial_by_service(
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Reportes por servicio (admin): ingresos y comisiones por tipo de servicio."""
    if not _role_is_admin(current_user):
        raise HTTPException(status_code=403, detail="No autorizado")

    q = db.query(Invoice)
    try:
        if from_date:
            fd = datetime.fromisoformat(from_date)
            q = q.filter(Invoice.issued_at >= fd)
        if to_date:
            td = datetime.fromisoformat(to_date)
            q = q.filter(Invoice.issued_at <= td)
    except Exception:
        raise HTTPException(status_code=422, detail="Formato de fecha inválido. Usa YYYY-MM-DD.")

    invoices = q.all()
    by = {}
    for inv in invoices:
        key = inv.service_name or "Sin servicio"
        if key not in by:
            by[key] = {
                "total_facturado": 0.0,
                "total_pagado": 0.0,
                "total_pendiente": 0.0,
                "ingreso_plataforma_pagado": 0.0,
                "ingreso_groomers_pagado": 0.0,
            }
        by[key]["total_facturado"] += _to_float(inv.total)
        if inv.status == InvoiceStatus.paid:
            by[key]["total_pagado"] += _to_float(inv.total)
            by[key]["ingreso_plataforma_pagado"] += _to_float(inv.platform_amount)
            by[key]["ingreso_groomers_pagado"] += _to_float(inv.groomer_amount)
        if inv.status == InvoiceStatus.pending:
            by[key]["total_pendiente"] += _to_float(inv.total)

    items = [
        ServiceIncomeOut(
            service_name=name,
            total_facturado=vals["total_facturado"],
            total_pagado=vals["total_pagado"],
            total_pendiente=vals["total_pendiente"],
            ingreso_plataforma_pagado=vals["ingreso_plataforma_pagado"],
            ingreso_groomers_pagado=vals["ingreso_groomers_pagado"],
        )
        for name, vals in sorted(by.items(), key=lambda x: x[1]["total_facturado"], reverse=True)
    ]
    return FinancialByServiceOut(items=items)
