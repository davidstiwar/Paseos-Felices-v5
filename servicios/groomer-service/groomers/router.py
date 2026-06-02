from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from datetime import datetime
from typing import List, Optional
from sqlalchemy.orm import Session
import httpx
import asyncio

from .schemas import GroomerCreate, GroomerUpdate, GroomerOut, ServiceInfo
from .models import Groomer, GroomerSpecialty, GroomerService
from groomers.database import get_db
from core.security import get_current_user
from core.config import settings

router = APIRouter(prefix="/groomers", tags=["groomers"])

async def get_service_details(service_id: int) -> Optional[ServiceInfo]:
    """Obtener detalles de un servicio desde el catálogo"""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{settings.SERVICES_CATALOG_URL}/catalog/{service_id}")
            if response.status_code == 200:
                service_data = response.json()
                # Map the database field names to the ServiceInfo schema
                return ServiceInfo(
                    id=service_data.get('id'),
                    name=service_data.get('name'),
                    description=service_data.get('description'),
                    category=service_data.get('category'),
                    base_price=service_data.get('base_price', 0.0),
                    duration_minutes=service_data.get('duration_minutes', 0)
                )
            else:
                print(f"Catalog service returned status {response.status_code} for service {service_id}")
    except Exception as e:
        print(f"Error fetching service {service_id}: {e}")
    return None

def get_groomer_specialties(groomer_id: int, db: Session) -> List[str]:
    """Obtener las especialidades de un groomer"""
    specialties = db.query(GroomerSpecialty).filter(
        GroomerSpecialty.groomer_id == groomer_id
    ).all()
    return [s.specialty_name for s in specialties]

async def get_groomer_services(groomer_id: int, db: Session) -> List[ServiceInfo]:
    """Obtener los servicios del catálogo que ofrece un groomer (en paralelo)"""
    groomer_services = db.query(GroomerService).filter(
        GroomerService.groomer_id == groomer_id
    ).all()
    
    if not groomer_services:
        return []
    
    # Hacer las llamadas HTTP en paralelo usando asyncio.gather
    service_tasks = [get_service_details(gs.service_id) for gs in groomer_services]
    services = await asyncio.gather(*service_tasks)
    
    # Filtrar los None (servicios que no se pudieron cargar)
    return [s for s in services if s is not None]

@router.get("/", response_model=List[GroomerOut])
async def get_all_groomers(active_only: bool = True, db: Session = Depends(get_db)):
    query = db.query(Groomer)
    if active_only:
        query = query.filter(Groomer.is_active == True)
    
    groomers = query.all()
    result = []
    for groomer in groomers:
        specialties = get_groomer_specialties(groomer.id, db)
        services = await get_groomer_services(groomer.id, db)
        groomer_dict = {
            "id": groomer.id,
            "email": groomer.email,
            "full_name": groomer.full_name,
            "phone": groomer.phone,
            "bio": groomer.bio,
            "photo": groomer.photo,
            "rating": float(groomer.rating) if groomer.rating else 0.0,
            "is_active": groomer.is_active,
            "created_at": groomer.created_at,
            "updated_at": groomer.updated_at,
            "specialties": specialties,
            "services": services
        }
        result.append(GroomerOut(**groomer_dict))
    return result

@router.get("/{groomer_id}", response_model=GroomerOut)
async def get_groomer(groomer_id: int, db: Session = Depends(get_db)):
    groomer = db.query(Groomer).filter(Groomer.id == groomer_id).first()
    if not groomer:
        raise HTTPException(status_code=404, detail="No encontramos el groomer que buscas. Verifica que el ID sea correcto.")
    
    specialties = get_groomer_specialties(groomer.id, db)
    services = await get_groomer_services(groomer.id, db)
    groomer_dict = {
        "id": groomer.id,
        "email": groomer.email,
        "full_name": groomer.full_name,
        "phone": groomer.phone,
        "bio": groomer.bio,
        "rating": float(groomer.rating) if groomer.rating else 0.0,
        "is_active": groomer.is_active,
        "created_at": groomer.created_at,
        "updated_at": groomer.updated_at,
        "specialties": specialties,
        "services": services
    }
    return GroomerOut(**groomer_dict)

@router.get("/email/{email}")
async def get_groomer_by_email(email: str, db: Session = Depends(get_db)):
    groomer = db.query(Groomer).filter(Groomer.email == email).first()
    if not groomer:
        return JSONResponse(content=None, status_code=200)
    
    specialties = get_groomer_specialties(groomer.id, db)
    services = await get_groomer_services(groomer.id, db)
    groomer_dict = {
        "id": groomer.id,
        "email": groomer.email,
        "full_name": groomer.full_name,
        "phone": groomer.phone,
        "bio": groomer.bio,
        "rating": float(groomer.rating) if groomer.rating else 0.0,
        "is_active": groomer.is_active,
        "created_at": groomer.created_at,
        "updated_at": groomer.updated_at,
        "specialties": specialties,
        "services": services
    }
    return GroomerOut(**groomer_dict)

@router.post("/", response_model=GroomerOut, status_code=status.HTTP_201_CREATED)
async def create_groomer(groomer_in: GroomerCreate, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    # Check if groomer already exists for this email
    existing = db.query(Groomer).filter(Groomer.email == current_user["email"]).first()
    if existing:
        raise HTTPException(status_code=400, detail="Ya tienes un perfil groomer creado. No puedes crear otro perfil.")

    new_groomer = Groomer(
        email=current_user["email"],
        full_name=groomer_in.full_name,
        phone=groomer_in.phone,
        bio=groomer_in.bio,
        photo=groomer_in.photo,
        rating=0.0,
        is_active=groomer_in.is_active,
    )

    db.add(new_groomer)
    db.commit()
    db.refresh(new_groomer)

    return new_groomer

@router.put("/{groomer_id}", response_model=GroomerOut)
async def update_groomer(groomer_id: int, update_data: GroomerUpdate, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    groomer = db.query(Groomer).filter(Groomer.id == groomer_id).first()
    if not groomer:
        raise HTTPException(status_code=404, detail="No encontramos el groomer que buscas. Verifica que el ID sea correcto.")

    # Solo el dueño o admin puede actualizar (simplificado)
    if groomer.email != current_user["email"]:
        raise HTTPException(status_code=403, detail="No tienes permiso para editar este perfil. Solo puedes editar tu propio perfil.")

    update_dict = update_data.dict(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(groomer, key, value)

    groomer.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(groomer)

    return groomer

@router.delete("/{groomer_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_groomer(groomer_id: int, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    groomer = db.query(Groomer).filter(Groomer.id == groomer_id).first()
    if not groomer:
        raise HTTPException(status_code=404, detail="No encontramos el groomer que buscas. Verifica que el ID sea correcto.")

    if groomer.email != current_user["email"]:
        raise HTTPException(status_code=403, detail="No tienes permiso para eliminar este perfil. Solo puedes eliminar tu propio perfil.")

    db.delete(groomer)
    db.commit()
    return None

# Endpoints para gestionar servicios del groomer
@router.post("/{groomer_id}/services/{service_id}", status_code=status.HTTP_201_CREATED)
async def add_service_to_groomer(groomer_id: int, service_id: int, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    groomer = db.query(Groomer).filter(Groomer.id == groomer_id).first()
    if not groomer:
        raise HTTPException(status_code=404, detail="No encontramos el groomer que buscas. Verifica que el ID sea correcto.")
    
    if groomer.email != current_user["email"]:
        raise HTTPException(status_code=403, detail="No tienes permiso para agregar servicios a este perfil. Solo puedes agregar servicios a tu propio perfil.")
    
    # Verificar si ya existe la relación
    existing = db.query(GroomerService).filter(
        GroomerService.groomer_id == groomer_id,
        GroomerService.service_id == service_id
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Ya ofreces este servicio. No puedes agregar el mismo servicio dos veces.")
    
    new_groomer_service = GroomerService(
        groomer_id=groomer_id,
        service_id=service_id
    )
    
    db.add(new_groomer_service)
    db.commit()
    db.refresh(new_groomer_service)
    
    return {"message": "Servicio agregado exitosamente"}

@router.delete("/{groomer_id}/services/{service_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_service_from_groomer(groomer_id: int, service_id: int, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    groomer = db.query(Groomer).filter(Groomer.id == groomer_id).first()
    if not groomer:
        raise HTTPException(status_code=404, detail="No encontramos el groomer que buscas. Verifica que el ID sea correcto.")
    
    if groomer.email != current_user["email"]:
        raise HTTPException(status_code=403, detail="No tienes permiso para eliminar servicios de este perfil. Solo puedes eliminar servicios de tu propio perfil.")
    
    groomer_service = db.query(GroomerService).filter(
        GroomerService.groomer_id == groomer_id,
        GroomerService.service_id == service_id
    ).first()
    
    if not groomer_service:
        raise HTTPException(status_code=404, detail="Este servicio no está en tu lista de servicios. Verifica que el servicio sea correcto.")
    
    db.delete(groomer_service)
    db.commit()
    
    return None
