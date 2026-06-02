"""
Endpoints de OAuth y Recuperación de Contraseña
Este archivo contiene los endpoints para autenticación con Google/Facebook y recuperación de contraseña.
Estos endpoints deben ser agregados al archivo router.py del auth-service.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from jose import jwt, JWTError
import httpx

from auth.schemas import (
    OAuthCallback, PasswordResetRequest, PasswordResetConfirm,
    Token, UserOut
)
from auth.models import User
from auth.database import get_db
from core.security import get_password_hash, create_access_token
from core.config import settings

router = APIRouter(prefix="/auth", tags=["auth"])


# ===== OAUTH ENDPOINTS =====

@router.get("/google/login")
async def google_oauth_login():
    """Redirige al usuario a Google para autenticación OAuth."""
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Google OAuth no configurado"
        )
    
    google_auth_url = (
        f"https://accounts.google.com/o/oauth2/v2/auth"
        f"?client_id={settings.GOOGLE_CLIENT_ID}"
        f"&redirect_uri={settings.GOOGLE_REDIRECT_URI}"
        f"&response_type=code"
        f"&scope=openid email profile"
    )
    
    return {"auth_url": google_auth_url}


@router.post("/google/callback", response_model=Token)
async def google_oauth_callback(callback: OAuthCallback, db: Session = Depends(get_db)):
    """Procesa el callback de Google OAuth y crea/autentica usuario."""
    if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Google OAuth no configurado"
        )
    
    # Intercambiar el código por un token de acceso
    async with httpx.AsyncClient() as client:
        token_response = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "code": callback.code,
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "redirect_uri": settings.GOOGLE_REDIRECT_URI,
                "grant_type": "authorization_code"
            }
        )
    
    if token_response.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Error al obtener token de Google"
        )
    
    token_data = token_response.json()
    access_token = token_data.get("access_token")
    
    # Obtener información del usuario
    async with httpx.AsyncClient() as client:
        user_info_response = await client.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {access_token}"}
        )
    
    if user_info_response.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Error al obtener información de usuario de Google"
        )
    
    user_info = user_info_response.json()
    email = user_info.get("email")
    google_id = user_info.get("id")
    nombre_completo = user_info.get("name", "")
    foto_url = user_info.get("picture")
    
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se pudo obtener email de Google"
        )
    
    # Buscar usuario existente por email
    user = db.query(User).filter(User.email == email).first()
    
    if user:
        # Usuario existe, actualizar si es necesario
        if not user.nombre_completo:
            user.nombre_completo = nombre_completo
        if not user.foto_url and foto_url:
            user.foto_url = foto_url
        db.commit()
        db.refresh(user)
    else:
        # Crear nuevo usuario
        hashed_password = get_password_hash(str(google_id))
        new_user = User(
            email=email,
            nombre_completo=nombre_completo,
            foto_url=foto_url,
            hashed_password=hashed_password,
            role="cliente",
            is_active=True
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        user = new_user
    
    # Generar token JWT
    access_token_jwt = create_access_token(
        data={"sub": user.email, "role": user.role}
    )
    
    return Token(
        access_token=access_token_jwt,
        user=UserOut(
            id=user.id,
            email=user.email,
            nombre_completo=user.nombre_completo,
            telefono=user.telefono,
            direccion=user.direccion,
            ciudad=user.ciudad,
            foto_url=user.foto_url,
            about_me=user.about_me,
            fecha_nacimiento=user.fecha_nacimiento,
            role=user.role,
        )
    )


@router.get("/facebook/login")
async def facebook_oauth_login():
    """Redirige al usuario a Facebook para autenticación OAuth."""
    if not settings.FACEBOOK_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Facebook OAuth no configurado"
        )
    
    facebook_auth_url = (
        f"https://www.facebook.com/v18.0/dialog/oauth"
        f"?client_id={settings.FACEBOOK_CLIENT_ID}"
        f"&redirect_uri={settings.FACEBOOK_REDIRECT_URI}"
        f"&response_type=code"
        f"&scope=email"
    )
    
    return {"auth_url": facebook_auth_url}


@router.post("/facebook/callback", response_model=Token)
async def facebook_oauth_callback(callback: OAuthCallback, db: Session = Depends(get_db)):
    """Procesa el callback de Facebook OAuth y crea/autentica usuario."""
    if not settings.FACEBOOK_CLIENT_ID or not settings.FACEBOOK_CLIENT_SECRET:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Facebook OAuth no configurado"
        )
    
    # Intercambiar el código por un token de acceso
    async with httpx.AsyncClient() as client:
        token_response = await client.get(
            "https://graph.facebook.com/v18.0/oauth/access_token",
            params={
                "client_id": settings.FACEBOOK_CLIENT_ID,
                "client_secret": settings.FACEBOOK_CLIENT_SECRET,
                "redirect_uri": settings.FACEBOOK_REDIRECT_URI,
                "code": callback.code
            }
        )
    
    if token_response.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Error al obtener token de Facebook"
        )
    
    token_data = token_response.json()
    access_token = token_data.get("access_token")
    
    # Obtener información del usuario
    async with httpx.AsyncClient() as client:
        user_info_response = await client.get(
            "https://graph.facebook.com/v18.0/me",
            params={
                "fields": "id,name,email,picture",
                "access_token": access_token
            }
        )
    
    if user_info_response.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Error al obtener información de usuario de Facebook"
        )
    
    user_info = user_info_response.json()
    email = user_info.get("email")
    facebook_id = user_info.get("id")
    nombre_completo = user_info.get("name", "")
    picture_data = user_info.get("picture", {})
    foto_url = picture_data.get("data", {}).get("url") if picture_data else None
    
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se pudo obtener email de Facebook"
        )
    
    # Buscar usuario existente por email
    user = db.query(User).filter(User.email == email).first()
    
    if user:
        # Usuario existe, actualizar si es necesario
        if not user.nombre_completo:
            user.nombre_completo = nombre_completo
        if not user.foto_url and foto_url:
            user.foto_url = foto_url
        db.commit()
        db.refresh(user)
    else:
        # Crear nuevo usuario
        hashed_password = get_password_hash(str(facebook_id))
        new_user = User(
            email=email,
            nombre_completo=nombre_completo,
            foto_url=foto_url,
            hashed_password=hashed_password,
            role="cliente",
            is_active=True
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        user = new_user
    
    # Generar token JWT
    access_token_jwt = create_access_token(
        data={"sub": user.email, "role": user.role}
    )
    
    return Token(
        access_token=access_token_jwt,
        user=UserOut(
            id=user.id,
            email=user.email,
            nombre_completo=user.nombre_completo,
            telefono=user.telefono,
            direccion=user.direccion,
            ciudad=user.ciudad,
            foto_url=user.foto_url,
            about_me=user.about_me,
            fecha_nacimiento=user.fecha_nacimiento,
            role=user.role,
        )
    )


# ===== PASSWORD RESET ENDPOINTS =====

@router.post("/password-reset/request")
async def request_password_reset(request: PasswordResetRequest, db: Session = Depends(get_db)):
    """Solicita recuperación de contraseña enviando un token por email."""
    user = db.query(User).filter(User.email == request.email).first()
    
    if not user:
        # No revelar si el email existe o no por seguridad
        return {"message": "Si el email existe, recibirás instrucciones para recuperar tu contraseña"}
    
    # Generar token de recuperación
    reset_token = jwt.encode(
        {
            "sub": user.email,
            "exp": datetime.utcnow() + timedelta(hours=settings.PASSWORD_RESET_TOKEN_EXPIRE_HOURS)
        },
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )
    
    # En un entorno real, aquí se enviaría el email con el token
    # Por ahora, simulamos el envío retornando el token
    reset_url = f"{settings.FRONTEND_URL}/reset-password?token={reset_token}"
    
    # TODO: Implementar envío real de email
    print(f"[PASSWORD RESET] Email: {user.email}, Reset URL: {reset_url}")
    
    return {
        "message": "Si el email existe, recibirás instrucciones para recuperar tu contraseña",
        "reset_url": reset_url  # Solo para desarrollo, remover en producción
    }


@router.post("/password-reset/confirm")
async def confirm_password_reset(confirm: PasswordResetConfirm, db: Session = Depends(get_db)):
    """Confirma el restablecimiento de contraseña usando el token."""
    try:
        payload = jwt.decode(
            confirm.token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        email = payload.get("sub")
        
        if not email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Token inválido"
            )
        
        user = db.query(User).filter(User.email == email).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado"
            )
        
        # Actualizar contraseña
        user.hashed_password = get_password_hash(confirm.new_password)
        db.commit()
        db.refresh(user)
        
        return {"message": "Contraseña actualizada exitosamente"}
        
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token expirado. Solicita una nueva recuperación de contraseña"
        )
    except jwt.JWTError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token inválido"
        )
