from sqlalchemy import Column, Integer, String, DateTime, Text
from sqlalchemy.sql import func

from reviews.database import Base


class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    client_email = Column(String(255), index=True, nullable=False)

    # Groomer del microservicio groomer-service
    groomer_id = Column(Integer, index=True, nullable=False)

    # Opcional: asociar reseña con una cita específica
    appointment_id = Column(Integer, index=True, nullable=True)

    rating = Column(Integer, nullable=False)  # 1..5 (validado en schema)
    comment = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

