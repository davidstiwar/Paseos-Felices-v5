from datetime import datetime, timedelta
from typing import Optional
import hashlib
from fastapi.security import OAuth2PasswordBearer
from jose import jwt

from common.security.jwt import create_get_current_user
from .config import settings

# Usar SHA-256 en lugar de bcrypt para evitar problemas de 72 bytes
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return hashlib.sha256(plain_password.encode('utf-8')).hexdigest() == hashed_password

def get_password_hash(password: str) -> str:
    return hashlib.sha256(password.encode('utf-8')).hexdigest()


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    # Convertir datetime a timestamp Unix (segundos desde epoch)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

# Use common JWT validation (but keep local oauth2_scheme for tokenUrl)
get_current_user = create_get_current_user(
    secret_key=settings.SECRET_KEY,
    algorithm=settings.ALGORITHM
)
