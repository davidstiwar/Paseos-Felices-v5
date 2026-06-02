from sqlalchemy import Column, Integer, String, DateTime, Numeric, Text
from sqlalchemy.sql import func
from pets.database import Base

class Pet(Base):
    __tablename__ = "pets"
    
    id = Column(Integer, primary_key=True, index=True)
    owner_email = Column(String(255), index=True, nullable=False)
    name = Column(String(255), nullable=False)
    breed = Column(String(255), nullable=True)
    age = Column(Integer, nullable=True)
    weight = Column(Numeric(5, 2), nullable=True)
    photo_url = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
