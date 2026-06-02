from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Optional, List

from pydantic import BaseModel, Field


class InvoiceStatus(str, Enum):
    pending = "pending"
    paid = "paid"
    cancelled = "cancelled"


class InvoiceOut(BaseModel):
    id: int
    invoice_number: str
    appointment_id: int

    client_email: str
    client_name: Optional[str] = None

    pet_id: int
    pet_name: Optional[str] = None

    groomer_email: Optional[str] = None
    groomer_name: Optional[str] = None

    service_name: str
    total: float
    status: InvoiceStatus

    issued_at: datetime
    paid_at: Optional[datetime] = None
    cancelled_at: Optional[datetime] = None

    # Interno (solo admin/groomer; el backend puede retornarlo como null para cliente)
    groomer_percentage: Optional[int] = None
    platform_percentage: Optional[int] = None
    groomer_amount: Optional[float] = None
    platform_amount: Optional[float] = None


class InvoiceDetailOut(InvoiceOut):
    subtotal: float

    # Interno (solo para admin/groomer)
    groomer_percentage: Optional[int] = None
    platform_percentage: Optional[int] = None
    groomer_amount: Optional[float] = None
    platform_amount: Optional[float] = None

    # Historial de pagos (admin)
    payments: Optional[List["PaymentOut"]] = None

    # Historial de transacciones de gateway (admin/cliente)
    gateway_transactions: Optional[List["PaymentGatewayTransactionOut"]] = None


class PaymentOut(BaseModel):
    id: int
    invoice_id: int
    method: str
    amount: float
    received_by_admin_email: str
    received_at: datetime


class PaymentGatewayTransactionOut(BaseModel):
    id: int
    invoice_id: int
    provider: str
    reference_code: str
    status: str
    transaction_id: Optional[str] = None
    amount: float
    currency: str
    created_at: datetime
    updated_at: Optional[datetime] = None


class MarkPaidIn(BaseModel):
    amount: Optional[float] = None


class CommissionSettingOut(BaseModel):
    groomer_percentage: int
    platform_percentage: int
    updated_at: Optional[datetime] = None


class CommissionUpdateIn(BaseModel):
    groomer_percentage: int = Field(ge=0, le=100)
    platform_percentage: int = Field(ge=0, le=100)
    reason: Optional[str] = None


class CommissionAuditOut(BaseModel):
    id: int
    previous_groomer_percentage: int
    previous_platform_percentage: int
    new_groomer_percentage: int
    new_platform_percentage: int
    changed_by_admin_email: str
    reason: Optional[str] = None
    changed_at: datetime


class FinancialSummaryOut(BaseModel):
    total_facturado: float
    total_pendiente: float
    total_pagado: float
    total_cancelado: float
    ingreso_plataforma: float
    ingreso_groomers: float


class GroomerIncomeOut(BaseModel):
    groomer_email: str
    total_facturado: float
    total_pagado: float
    ingreso_estimado: float


class FinancialByGroomerOut(BaseModel):
    items: List[GroomerIncomeOut]


class ServiceIncomeOut(BaseModel):
    service_name: str
    total_facturado: float
    total_pagado: float
    total_pendiente: float
    ingreso_plataforma_pagado: float
    ingreso_groomers_pagado: float


class FinancialByServiceOut(BaseModel):
    items: List[ServiceIncomeOut]
