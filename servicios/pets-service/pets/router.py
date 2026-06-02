from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from pets.schemas import PetCreate, PetUpdate, PetOut
from pets.models import Pet
from pets.database import get_db
from core.security import get_current_user

router = APIRouter(prefix="/pets", tags=["pets"])

@router.post("/", response_model=PetOut, status_code=status.HTTP_201_CREATED)
async def create_pet(pet_in: PetCreate, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    owner_email = current_user["email"]
    # Si viene owner_email, solo admin puede crear para otro usuario
    if pet_in.owner_email and pet_in.owner_email != current_user["email"]:
        if current_user.get("role") != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permisos para crear mascotas para otro usuario",
            )
        owner_email = pet_in.owner_email

    new_pet = Pet(
        owner_email=owner_email,
        name=pet_in.name,
        breed=pet_in.breed,
        age=pet_in.age,
        weight=pet_in.weight,
        notes=pet_in.notes,
        photo_url=pet_in.photo_url,
    )

    db.add(new_pet)
    db.commit()
    db.refresh(new_pet)

    return PetOut(
        id=new_pet.id,
        owner_email=new_pet.owner_email,
        name=new_pet.name,
        breed=new_pet.breed,
        age=new_pet.age,
        weight=new_pet.weight,
        notes=new_pet.notes,
        photo_url=new_pet.photo_url,
        created_at=new_pet.created_at,
    )

@router.get("/all", response_model=List[PetOut])
async def get_all_pets(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    """Obtener todas las mascotas (solo para admin)"""
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo administradores pueden ver todas las mascotas",
        )
    all_pets = db.query(Pet).order_by(Pet.created_at.desc()).all()
    return [
        PetOut(
            id=pet.id,
            owner_email=pet.owner_email,
            name=pet.name,
            breed=pet.breed,
            age=pet.age,
            weight=pet.weight,
            notes=pet.notes,
            photo_url=pet.photo_url,
            created_at=pet.created_at,
        )
        for pet in all_pets
    ]

@router.get("/public/all")
async def get_all_pets_public(db: Session = Depends(get_db)):
    """Obtener todas las mascotas sin autenticación (para frontend público)"""
    try:
        all_pets = db.query(Pet).order_by(Pet.created_at.desc()).all()
        return [
            {
                "id": pet.id,
                "owner_email": pet.owner_email,
                "name": pet.name,
                "breed": pet.breed,
                "age": pet.age,
                "weight": pet.weight,
                "notes": pet.notes,
                "photo_url": pet.photo_url,
                "created_at": pet.created_at,
            }
            for pet in all_pets
        ]
    except Exception as e:
        print(f"Error getting all pets (public): {str(e)}")
        return []

@router.get("/", response_model=List[PetOut])
async def get_my_pets(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    user_pets = db.query(Pet).filter(Pet.owner_email == current_user["email"]).all()
    return [
        PetOut(
            id=pet.id,
            owner_email=pet.owner_email,
            name=pet.name,
            breed=pet.breed,
            age=pet.age,
            weight=pet.weight,
            notes=pet.notes,
            photo_url=pet.photo_url,
            created_at=pet.created_at,
        )
        for pet in user_pets
    ]

@router.get("/{pet_id}", response_model=PetOut)
async def get_pet(pet_id: int, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    pet = db.query(Pet).filter(Pet.id == pet_id).first()
    if not pet or pet.owner_email != current_user["email"]:
        raise HTTPException(status_code=404, detail="No encontramos la mascota que buscas. Verifica que el ID sea correcto.")
    return PetOut(
        id=pet.id,
        owner_email=pet.owner_email,
        name=pet.name,
        breed=pet.breed,
        age=pet.age,
        weight=pet.weight,
        notes=pet.notes,
        photo_url=pet.photo_url,
        created_at=pet.created_at,
    )

@router.get("/debug/health")
async def debug_health():
    """Endpoint de diagnóstico para verificar si el servicio está healthy"""
    return {"status": "healthy", "service": "pets"}

@router.get("/debug/count")
async def debug_count(db: Session = Depends(get_db)):
    """Endpoint de diagnóstico para contar cuántas mascotas hay en la base de datos"""
    count = db.query(Pet).count()
    return {"total_pets": count}

@router.get("/debug/all-pets")
async def debug_all_pets(db: Session = Depends(get_db)):
    """Endpoint de diagnóstico para ver todas las mascotas en la base de datos"""
    all_pets = db.query(Pet).all()
    print(f"[DEBUG] Total pets in database: {len(all_pets)}")
    return [
        {
            "id": pet.id,
            "owner_email": pet.owner_email,
            "name": pet.name,
            "breed": pet.breed,
        }
        for pet in all_pets
    ]

@router.post("/debug/seed-sample-data")
async def seed_sample_data(db: Session = Depends(get_db)):
    """Endpoint para agregar datos de muestra a la base de datos"""
    try:
        # Verificar si ya hay datos
        existing_pet = db.query(Pet).filter(Pet.id == 1).first()
        if existing_pet:
            return {"message": "Sample data already exists", "total_pets": db.query(Pet).count()}
        
        # Agregar mascota de muestra
        # Use None for photo_url in sample data to avoid inserting truncated/invalid data URIs
        sample_pet = Pet(
            owner_email="cliente@gmail.com",
            name="batman",
            breed="doberman",
            age=1,
            weight=24.8,
            notes="Mascota de prueba",
            photo_url=None,
        )
        
        db.add(sample_pet)
        db.commit()
        db.refresh(sample_pet)
        
        return {
            "message": "Sample data added successfully",
            "pet_id": sample_pet.id,
            "pet_name": sample_pet.name,
            "total_pets": db.query(Pet).count()
        }
    except Exception as e:
        print(f"[ERROR] Error seeding sample data: {e}")
        db.rollback()
        return {"error": str(e)}

@router.get("/internal/{pet_id}", response_model=PetOut)
async def get_pet_internal(pet_id: int, db: Session = Depends(get_db)):
    """Endpoint interno para obtener detalles de mascota sin autenticación (para otros servicios)"""
    print(f"[DEBUG] get_pet_internal called with pet_id: {pet_id}")
    pet = db.query(Pet).filter(Pet.id == pet_id).first()
    print(f"[DEBUG] Pet query result: {pet}")
    if not pet:
        print(f"[DEBUG] Pet not found for pet_id: {pet_id}")
        raise HTTPException(status_code=404, detail="No encontramos la mascota que buscas. Verifica que el ID sea correcto.")
    print(f"[DEBUG] Pet name: {pet.name}")
    result = PetOut(
        id=pet.id,
        owner_email=pet.owner_email,
        name=pet.name,
        breed=pet.breed,
        age=pet.age,
        weight=pet.weight,
        notes=pet.notes,
        photo_url=pet.photo_url,
        created_at=pet.created_at,
    )
    print(f"[DEBUG] Returning PetOut: {result}")
    return result

@router.put("/{pet_id}", response_model=PetOut)
async def update_pet(pet_id: int, pet_update: PetUpdate, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    pet = db.query(Pet).filter(Pet.id == pet_id).first()
    if not pet or pet.owner_email != current_user["email"]:
        raise HTTPException(status_code=404, detail="No encontramos la mascota que buscas. Verifica que el ID sea correcto.")

    if pet_update.name is not None:
        pet.name = pet_update.name
    if pet_update.breed is not None:
        pet.breed = pet_update.breed
    if pet_update.age is not None:
        pet.age = pet_update.age
    if pet_update.weight is not None:
        pet.weight = pet_update.weight
    if pet_update.notes is not None:
        pet.notes = pet_update.notes
    if pet_update.photo_url is not None:
        pet.photo_url = pet_update.photo_url

    db.commit()
    db.refresh(pet)

    return PetOut(
        id=pet.id,
        owner_email=pet.owner_email,
        name=pet.name,
        breed=pet.breed,
        age=pet.age,
        weight=pet.weight,
        notes=pet.notes,
        photo_url=pet.photo_url,
        created_at=pet.created_at,
    )

@router.delete("/{pet_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_pet(pet_id: int, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    pet = db.query(Pet).filter(Pet.id == pet_id).first()
    if not pet or pet.owner_email != current_user["email"]:
        raise HTTPException(status_code=404, detail="No encontramos la mascota que buscas. Verifica que el ID sea correcto.")

    db.delete(pet)
    db.commit()
    return None
