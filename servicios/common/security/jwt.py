from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt

def create_get_current_user(secret_key: str, algorithm: str):
    """Factory function to create get_current_user dependency"""
    oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")
    
    def get_current_user(token: str = Depends(oauth2_scheme)) -> Dict[str, Any]:
        credentials_exception = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
        try:
            payload = jwt.decode(token, secret_key, algorithms=[algorithm])
            email: str = payload.get("sub")
            role: str = payload.get("role")
            if email is None:
                raise credentials_exception
            return {"email": email, "role": role}
        except JWTError:
            raise credentials_exception
    
    return get_current_user
