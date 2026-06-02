from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from sqlalchemy.orm import Session

from .schemas import ReviewCreate, ReviewUpdate, ReviewOut
from .models import Review
from reviews.database import get_db
from core.security import get_current_user

router = APIRouter(prefix="/reviews", tags=["reviews"])

@router.post("/", response_model=ReviewOut, status_code=status.HTTP_201_CREATED)
async def create_review(
    review_in: ReviewCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Evitar duplicados por cita (un cliente solo puede reseñar 1 vez por appointment_id)
    if review_in.appointment_id is not None:
        existing = db.query(Review).filter(
            Review.appointment_id == review_in.appointment_id,
            Review.client_email == current_user["email"],
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Ya has dejado una reseña para esta cita.")

    new_review = Review(
        client_email=current_user["email"],
        groomer_id=review_in.groomer_id,
        appointment_id=review_in.appointment_id,
        rating=review_in.rating,
        comment=review_in.comment,
    )
    db.add(new_review)
    db.commit()
    db.refresh(new_review)
    return new_review

@router.get("/me", response_model=List[ReviewOut])
async def get_my_reviews(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    """Listar reseñas del usuario autenticado"""
    return db.query(Review).filter(Review.client_email == current_user["email"]).order_by(Review.created_at.desc()).all()

@router.get("/appointment/{appointment_id}", response_model=Optional[ReviewOut])
async def get_review_by_appointment(appointment_id: int, db: Session = Depends(get_db)):
    """Obtener la reseña asociada a una cita (si existe)."""
    return db.query(Review).filter(Review.appointment_id == appointment_id).first()

@router.get("/groomer/{groomer_id}", response_model=List[ReviewOut])
async def get_reviews_by_groomer(groomer_id: int, db: Session = Depends(get_db)):
    return db.query(Review).filter(Review.groomer_id == groomer_id).order_by(Review.created_at.desc()).all()

@router.get("/public/all", response_model=List[ReviewOut])
async def get_all_reviews_public(db: Session = Depends(get_db), limit: int = 10):
    """Obtener todas las reviews públicamente (para landing page)"""
    return db.query(Review).order_by(Review.created_at.desc()).limit(limit).all()

@router.get("/{review_id}", response_model=ReviewOut)
async def get_review(review_id: int, db: Session = Depends(get_db)):
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Reseña no encontrada")
    return review

@router.put("/{review_id}", response_model=ReviewOut)
async def update_review(
    review_id: int,
    update_data: ReviewUpdate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Reseña no encontrada")

    # Solo el autor puede editar su reseña
    if review.client_email != current_user["email"]:
        raise HTTPException(status_code=403, detail="No tienes permiso para editar esta reseña")

    if update_data.rating is not None:
        review.rating = update_data.rating
    if update_data.comment is not None:
        review.comment = update_data.comment

    db.commit()
    db.refresh(review)
    return review

@router.delete("/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_review(
    review_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Reseña no encontrada")

    if review.client_email != current_user["email"]:
        raise HTTPException(status_code=403, detail="No tienes permiso")

    db.delete(review)
    db.commit()
    return None
