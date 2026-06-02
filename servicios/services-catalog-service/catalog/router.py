from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
from typing import List
from sqlalchemy.orm import Session
from sqlalchemy import text

from catalog.schemas import ServiceCreate, ServiceUpdate, ServiceOut, ServiceCategory
from catalog.database import get_db
from catalog.models import Service
from core.security import get_current_user

router = APIRouter(prefix="/catalog", tags=["catalog"])

@router.post("/debug/seed-sample-data")
async def seed_sample_data(db: Session = Depends(get_db)):
    """Endpoint para agregar datos de muestra a la base de datos"""
    try:
        # Verificar si ya hay datos
        existing_services = db.query(Service).count()
        if existing_services > 0:
            return {"message": "Sample data already exists", "total_services": existing_services}
        
        # Crear servicios de muestra
        sample_services = [
            Service(
                name="Paseo Premium",
                description="Paseo de 30 minutos en parque",
                category="Paseo",
                base_price=35.0,
                duration_minutes=30,
                is_active=True
            ),
            Service(
                name="Baño Completo",
                description="Baño, corte y limpieza",
                category="Baño",
                base_price=50.0,
                duration_minutes=60,
                is_active=True
            ),
            Service(
                name="Corte de Pelo",
                description="Corte de pelo profesional",
                category="Peluquería",
                base_price=25.0,
                duration_minutes=30,
                is_active=True
            ),
            Service(
                name="Limpieza de Oídos",
                description="Limpieza profunda de oídos",
                category="Higiene",
                base_price=15.0,
                duration_minutes=15,
                is_active=True
            ),
            Service(
                name="Corte de Uñas",
                description="Corte y limado de uñas",
                category="Higiene",
                base_price=10.0,
                duration_minutes=10,
                is_active=True
            ),
        ]
        
        for service in sample_services:
            db.add(service)
        
        db.commit()
        
        return {
            "message": "Sample data added successfully",
            "total_services": len(sample_services),
            "services": [{"name": s.name, "category": s.category} for s in sample_services]
        }
    except Exception as e:
        print(f"[ERROR] Error seeding sample data: {e}")
        db.rollback()
        return {"error": str(e)}

@router.get("/test")
async def test_endpoint():
    """Simple test endpoint that doesn't use database"""
    return {"message": "Test endpoint works", "status": "ok"}

@router.get("/")
async def get_all_services(active_only: bool = True):
    """
    Public endpoint - List all services (can be used by clients and groomers).
    Nota: Usamos SQLAlchemy `engine` + SQL directo para:
      - respetar DATABASE_URL (.env) y evitar credenciales hardcodeadas
      - mantener el endpoint público independiente del ORM (debug / compatibilidad)
    """
    try:
        query = "SELECT * FROM services"
        params = {}
        if active_only:
            query += " WHERE is_active = :active"
            params["active"] = 1

        with engine.connect() as conn:
            result = conn.execute(text(query), params)
            services = [dict(row) for row in result.mappings().all()]

        # Garantizar JSON-serializable (por si base_price llega como Decimal)
        for service in services:
            if "base_price" in service and service["base_price"] is not None:
                service["base_price"] = float(service["base_price"])

        return services
    except Exception as e:
        print(f"Error fetching services: {e}")
        return []

@router.get("/{service_id}")
async def get_service(service_id: int):
    """Get service by ID - SQL directo usando `engine` (respeta DATABASE_URL)."""
    try:
        with engine.connect() as conn:
            result = conn.execute(
                text("SELECT * FROM services WHERE id = :id"),
                {"id": service_id},
            )
            row = result.mappings().first()
            service = dict(row) if row else None
        
        if not service:
            raise HTTPException(status_code=404, detail="No encontramos el servicio que buscas. Verifica que el ID sea correcto.")
        
        # Convert Decimal to float for JSON serialization
        if 'base_price' in service and service['base_price'] is not None:
            service['base_price'] = float(service['base_price'])
        
        return service
    except Exception as e:
        print(f"Error fetching service {service_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching service: {str(e)}")

@router.post("/", response_model=ServiceOut, status_code=status.HTTP_201_CREATED)
async def create_service(service_in: ServiceCreate, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    """Only admins should be able to create services (for now any authenticated user)"""
    service = Service(
        name=service_in.name,
        description=service_in.description,
        category=service_in.category,
        base_price=service_in.base_price,
        duration_minutes=service_in.duration_minutes,
        is_active=service_in.is_active,
    )
    db.add(service)
    db.commit()
    db.refresh(service)
    return service

@router.put("/{service_id}", response_model=ServiceOut)
async def update_service(service_id: int, service_update: ServiceUpdate, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    service = db.query(Service).filter(Service.id == service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="No encontramos el servicio que buscas. Verifica que el ID sea correcto.")

    update_data = service_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(service, key, value)

    service.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(service)
    return service

@router.delete("/{service_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_service(service_id: int, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    service = db.query(Service).filter(Service.id == service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="No encontramos el servicio que buscas. Verifica que el ID sea correcto.")

    db.delete(service)
    db.commit()
    return None
