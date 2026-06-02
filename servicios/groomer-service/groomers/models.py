from sqlalchemy import Column, Integer, String, DateTime, Text, Numeric, Boolean, JSON, ForeignKey
from sqlalchemy.sql import func
from groomers.database import Base

class Groomer(Base):
    __tablename__ = "groomers"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    phone = Column(String(50), nullable=False)
    bio = Column(Text, nullable=True)
    photo = Column(Text, nullable=True)
    rating = Column(Numeric(3, 2), default=0.0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class GroomerSpecialty(Base):
    __tablename__ = "groomer_specialties"
    
    id = Column(Integer, primary_key=True, index=True)
    groomer_id = Column(Integer, nullable=False)
    specialty_name = Column(String(100), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class GroomerAvailability(Base):
    __tablename__ = "groomer_availability"
    
    id = Column(Integer, primary_key=True, index=True)
    groomer_id = Column(Integer, nullable=False)
    day_of_week = Column(String(20), nullable=False)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    is_available = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class GroomerService(Base):
    __tablename__ = "groomer_services"
    
    id = Column(Integer, primary_key=True, index=True)
    groomer_id = Column(Integer, ForeignKey('groomers.id'), nullable=False)
    service_id = Column(Integer, nullable=False)  # ID del servicio en el catálogo
    created_at = Column(DateTime(timezone=True), server_default=func.now())
