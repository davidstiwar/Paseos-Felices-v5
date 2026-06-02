from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime
from typing import List

from .schemas import UserProfileCreate, UserProfileUpdate, UserProfileOut
from core.security import get_current_user

router = APIRouter(prefix="/profiles", tags=["profiles"])

# In-memory storage
profiles_db = {}

@router.get("/me", response_model=UserProfileOut)
async def get_my_profile(current_user: dict = Depends(get_current_user)):
    email = current_user["email"]
    profile = profiles_db.get(email)
    
    if not profile:
        # Return empty profile if not exists
        return UserProfileOut(
            email=email,
            created_at=datetime.utcnow()
        )
    
    return UserProfileOut(**profile)

@router.put("/me", response_model=UserProfileOut)
async def update_my_profile(profile_update: UserProfileUpdate, current_user: dict = Depends(get_current_user)):
    email = current_user["email"]
    now = datetime.utcnow()
    
    if email not in profiles_db:
        # Create new profile
        profile_dict = {
            "email": email,
            "full_name": profile_update.full_name,
            "phone": profile_update.phone,
            "address": profile_update.address,
            "city": profile_update.city,
            "preferred_zones": profile_update.preferred_zones or [],
            "bio": profile_update.bio,
            "profile_picture_url": profile_update.profile_picture_url,
            "created_at": now,
            "updated_at": now,
        }
        profiles_db[email] = profile_dict
    else:
        # Update existing
        profile = profiles_db[email]
        update_data = profile_update.dict(exclude_unset=True)
        
        for key, value in update_data.items():
            profile[key] = value
        
        profile["updated_at"] = now
        profiles_db[email] = profile
    
    return UserProfileOut(**profiles_db[email])

@router.get("/{email}", response_model=UserProfileOut)
async def get_profile_by_email(email: str, current_user: dict = Depends(get_current_user)):
    # For now, allow any authenticated user to view profiles (can be restricted later)
    profile = profiles_db.get(email)
    
    if not profile:
        raise HTTPException(status_code=404, detail="Perfil no encontrado")
    
    return UserProfileOut(**profile)
