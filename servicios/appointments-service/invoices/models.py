from __future__ import annotations

import enum

from sqlalchemy import Column, Integer, String, DateTime, Numeric, Enum as SQLEnum, Text, Index
from sqlalchemy.sql import func

from appointments.database import Base


class InvoiceStatus(str, enum.Enum):
    pending = "pending"
    paid = "paid"
    cancelled = "cancelled"


class PaymentMethod(str, enum.Enum):
    cash = "cash"


class CommissionSetting(Base):
    __tablename__ = "commission_settings"

    id = Column(Integer, primary_key=True, index=True)
    groomer_percentage = Column(Integer, nullable=False)     # 0..100
    platform_percentage = Column(Integer, nullable=False)    # 0..100
    is_active = Column(Integer, nullable=False, default=1)   # 1 = activo, 0 = inactivo (evitamos boolean por compat)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        Index("idx_commission_is_active", "is_active"),
    )


class CommissionChangeAudit(Base):
    __tablename__ = "commission_change_audit"

    id = Column(Integer, primary_key=True, index=True)
    previous_groomer_percentage = Column(Integer, nullable=False)
    previous_platform_percentage = Column(Integer, nullable=False)
    new_groomer_percentage = Column(Integer, nullable=False)
    new_platform_percentage = Column(Integer, nullable=False)

    changed_by_admin_email = Column(String(255), nullable=False)
    reason = Column(Text, nullable=True)

    changed_at = Column(DateTime(timezone=True), server_default=func.now())


class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, index=True)
    invoice_number = Column(String(20), unique=True, index=True, nullable=True)

    appointment_id = Column(Integer, index=True, nullable=False)

    client_email = Column(String(255), index=True, nullable=False)
    pet_id = Column(Integer, nullable=False)
    groomer_email = Column(String(255), index=True, nullable=True)

    service_name = Column(String(255), nullable=False)

    subtotal = Column(Numeric(10, 2), nullable=False)
    total = Column(Numeric(10, 2), nullable=False)

    status = Column(SQLEnum(InvoiceStatus), default=InvoiceStatus.pending, nullable=False)

    issued_at = Column(DateTime(timezone=True), server_default=func.now())
    paid_at = Column(DateTime(timezone=True), nullable=True)
    cancelled_at = Column(DateTime(timezone=True), nullable=True)

    # Persistencia histórica de comisiones
    groomer_percentage = Column(Integer, nullable=False)
    platform_percentage = Column(Integer, nullable=False)
    groomer_amount = Column(Numeric(10, 2), nullable=False)
    platform_amount = Column(Numeric(10, 2), nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        Index("idx_invoices_status", "status"),
    )


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, index=True, nullable=False)
    method = Column(SQLEnum(PaymentMethod), default=PaymentMethod.cash, nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    received_by_admin_email = Column(String(255), nullable=False)
    received_at = Column(DateTime(timezone=True), server_default=func.now())


class PaymentGatewayTransaction(Base):
    """
    Transacciones creadas/recibidas desde gateways (ej: PayU).
    Se guarda separado de `payments` para evitar dependencias con el enum existente.
    """

    __tablename__ = "payment_gateway_transactions"

    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, index=True, nullable=False)
    provider = Column(String(50), nullable=False)  # "payu"

    reference_code = Column(String(128), index=True, nullable=False)
    status = Column(String(50), nullable=False, default="initiated")  # initiated|pending|approved|declined|error
    transaction_id = Column(String(128), nullable=True)

    amount = Column(Numeric(10, 2), nullable=False)
    currency = Column(String(10), nullable=False, default="COP")

    raw_payload = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        Index("idx_gateway_invoice_provider", "invoice_id", "provider"),
        Index("idx_gateway_reference", "reference_code"),
    )
