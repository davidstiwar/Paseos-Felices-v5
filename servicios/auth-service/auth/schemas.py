from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import date, datetime

class UserBase(BaseModel):
    email: EmailStr
    nombre_completo: Optional[str] = None
    telefono: Optional[str] = None
    direccion: Optional[str] = None
    ciudad: Optional[str] = None
    foto_url: Optional[str] = None
    about_me: Optional[str] = None
    fecha_nacimiento: Optional[date] = None

class UserCreate(UserBase):
    password: str = Field(min_length=6)
    nombre_completo: str
    telefono: str
    direccion: str
    ciudad: Optional[str] = None  # Opcional - frontend puede enviar null
    fecha_nacimiento: date  # Requerido para registro

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserOut(UserBase):
    id: int
    role: str

    class Config:
        from_attributes = True


class AdminUserOut(UserBase):
    """Salida de usuario para pantallas/admin: incluye campos de control."""
    id: int
    role: str
    is_active: bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    nombre_completo: Optional[str] = None
    telefono: Optional[str] = None
    direccion: Optional[str] = None
    ciudad: Optional[str] = None
    foto_url: Optional[str] = None
    about_me: Optional[str] = None
    fecha_nacimiento: Optional[date] = None

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None


class PasswordChange(BaseModel):
    current_password: str
    new_password: str = Field(min_length=6)


# ===== ADMIN USER MANAGEMENT SCHEMAS =====

class AdminUserUpdate(UserUpdate):
    """Actualización de usuario por admin (NO permite cambiar email ni password aquí)."""
    # Campos admin-only:
    role: Optional[str] = None
    is_active: Optional[bool] = None


class AdminUserRoleUpdate(BaseModel):
    role: str


class AdminUserStatusUpdate(BaseModel):
    is_active: bool


# ===== ADMIN STATS =====

class AdminUserStatsOut(BaseModel):
    """KPIs/estadísticas para panel admin de usuarios."""
    total: int
    clientes: int
    groomers: int
    admins: int
    activos: int
    bloqueados: int
    nuevos_7_dias: int
    nuevos_30_dias: int
    solicitudes_groomer_pendientes: int


# ===== GROOMER APPLICATION SCHEMAS =====

class GroomerApplicationCreate(BaseModel):
    email: EmailStr
    nombre_completo: str = Field(min_length=3)
    telefono: str
    password: str = Field(min_length=6)
    ciudad: str
    direccion: str
    fecha_nacimiento: date
    foto_url: Optional[str] = None
    about_me: str = Field(min_length=10)

class GroomerApplicationOut(BaseModel):
    id: int
    email: str
    nombre_completo: str
    telefono: str
    ciudad: str
    direccion: str
    fecha_nacimiento: date
    foto_url: Optional[str] = None
    about_me: str
    status: str
    rejection_reason: Optional[str] = None
    reviewed_by_admin_id: Optional[int] = None
    reviewed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class GroomerApplicationApprove(BaseModel):
    admin_id: int
    application_id: int

class GroomerApplicationReject(BaseModel):
    admin_id: int
    application_id: int
    rejection_reason: str


# ===== OAUTH SCHEMAS =====

class OAuthCallback(BaseModel):
    code: str
    state: Optional[str] = None


class OAuthUserCreate(BaseModel):
    email: EmailStr
    nombre_completo: str
    provider: str  # 'google'
    provider_id: str
    foto_url: Optional[str] = None


# ===== PASSWORD RESET SCHEMAS =====

class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str = Field(min_length=6)
