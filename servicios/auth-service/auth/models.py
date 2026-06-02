from sqlalchemy import Column, Integer, String, DateTime, Boolean, Enum as SQLEnum, Date
from sqlalchemy.sql import func
from auth.database import Base
import enum

class UserRole(str, enum.Enum):
    cliente = "cliente"
    groomer = "groomer"
    admin = "admin"

class ApplicationStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    nombre_completo = Column(String(255), nullable=False)
    telefono = Column(String(50), nullable=False)
    direccion = Column(String(255), nullable=False)
    ciudad = Column(String(100), nullable=True)
    foto_url = Column(String(500), nullable=True)
    about_me = Column(String, nullable=True)
    fecha_nacimiento = Column(Date, nullable=True)
    hashed_password = Column(String(255), nullable=False)
    role = Column(SQLEnum(UserRole), default=UserRole.cliente, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class GroomerApplication(Base):
    __tablename__ = "groomer_applications"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    nombre_completo = Column(String(255), nullable=False)
    telefono = Column(String(50), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    ciudad = Column(String(100), nullable=False)
    direccion = Column(String(255), nullable=False)
    fecha_nacimiento = Column(Date, nullable=False)
    foto_url = Column(String(500), nullable=True)
    about_me = Column(String, nullable=False)
    status = Column(SQLEnum(ApplicationStatus), default=ApplicationStatus.pending, nullable=False)
    rejection_reason = Column(String, nullable=True)
    reviewed_by_admin_id = Column(Integer, nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
