from fastapi import APIRouter, Depends, HTTPException, status, WebSocket, WebSocketDisconnect, UploadFile, File, Request
from sqlalchemy.orm import Session
from datetime import datetime, date as date_type, timedelta
import asyncio
import os

from jose import JWTError, jwt

from auth.schemas import (
    UserCreate, UserLogin, Token, UserOut, UserUpdate, PasswordChange,
    AdminUserOut, AdminUserUpdate, AdminUserRoleUpdate, AdminUserStatusUpdate,
    AdminUserStatsOut,
    GroomerApplicationCreate, GroomerApplicationOut, 
    GroomerApplicationApprove, GroomerApplicationReject,
    OAuthCallback, PasswordResetRequest, PasswordResetConfirm
)
from auth.models import User, GroomerApplication, ApplicationStatus
from auth.database import get_db
from core.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    get_current_user,
)
from core.config import settings

router = APIRouter(prefix="/auth", tags=["auth"])


def _require_admin(current_user: dict, db: Session) -> User:
    """Valida que el usuario autenticado exista en BD y sea admin activo."""
    user = db.query(User).filter(User.email == current_user["email"]).first()
    if not user or user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo administradores pueden realizar esta accion",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuario inactivo",
        )
    return user

@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(user_in: UserCreate, db: Session = Depends(get_db)):
    # Pydantic (UserCreate) ya valida los campos requeridos.
    # Mantenemos solo validaciones de negocio adicionales.
    today = datetime.utcnow().date()

    if user_in.fecha_nacimiento is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="La fecha de nacimiento es obligatoria"
        )

    if user_in.fecha_nacimiento > today:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="fecha_nacimiento no puede estar en el futuro"
        )

    # Edad minima de 1 ano (regla de negocio)
    min_birth_date = today.replace(year=today.year - 1)
    if user_in.fecha_nacimiento > min_birth_date:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Debes tener al menos 1 ano"
        )

    existing_user = db.query(User).filter(User.email == user_in.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El correo electronico ya esta registrado"
        )

    try:
        hashed_password = get_password_hash(user_in.password)
        new_user = User(
            email=user_in.email,
            nombre_completo=user_in.nombre_completo,
            telefono=user_in.telefono,
            direccion=user_in.direccion,
            ciudad=user_in.ciudad,
            foto_url=user_in.foto_url,
            about_me=user_in.about_me,
            fecha_nacimiento=user_in.fecha_nacimiento,
            hashed_password=hashed_password,
            role="cliente",
            is_active=True,
        )

        db.add(new_user)
        db.commit()
        db.refresh(new_user)
    except Exception as e:
        # Devuelve 400 con detalle para que el frontend reciba JSON
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Hubo un error al registrar tu cuenta. Por favor, intenta nuevamente mas tarde."
        )

    # Generar token JWT automaticamente despues del registro (auto-login)
    access_token = create_access_token(
        data={"sub": new_user.email, "role": new_user.role}
    )

    return Token(
        access_token=access_token,
        user=UserOut(
            id=new_user.id,
            email=new_user.email,
            nombre_completo=new_user.nombre_completo,
            telefono=new_user.telefono,
            direccion=new_user.direccion,
            ciudad=new_user.ciudad,
            foto_url=new_user.foto_url,
            about_me=new_user.about_me,
            fecha_nacimiento=new_user.fecha_nacimiento,
            role=new_user.role,
        ),
    )

@router.post("/login", response_model=Token)
async def login(form_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.email).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Correo o contrasena incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tu cuenta esta desactivada. Contacta a soporte.",
        )

    if not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Correo o contrasena incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(
        data={"sub": user.email, "role": user.role}
    )

    return Token(
        access_token=access_token,
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
        ),
    )

@router.get("/users/all", response_model=list[UserOut])
async def get_all_users(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    """Obtener todos los usuarios (solo para admin)"""
    _require_admin(current_user, db)
    users = db.query(User).order_by(User.created_at.desc()).all()
    return [
        UserOut(
            id=u.id,
            email=u.email,
            nombre_completo=u.nombre_completo,
            telefono=u.telefono,
            direccion=u.direccion,
            ciudad=u.ciudad,
            foto_url=u.foto_url,
            about_me=u.about_me,
            fecha_nacimiento=u.fecha_nacimiento,
            role=u.role,
        )
        for u in users
    ]


@router.get("/admin/users/all", response_model=list[AdminUserOut])
async def get_all_users_admin(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Obtener todos los usuarios con campos admin (solo admin)."""
    _require_admin(current_user, db)
    users = db.query(User).order_by(User.created_at.desc()).all()
    return users


@router.get("/admin/users/stats", response_model=AdminUserStatsOut)
async def get_admin_users_stats(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Estadísticas agregadas de usuarios para el panel admin.
    Nota: Se calcula en batch desde la BD (no tiempo real).
    """
    _require_admin(current_user, db)

    users = db.query(User).all()

    total = len(users)
    clientes = sum(1 for u in users if u.role == "cliente")
    groomers = sum(1 for u in users if u.role == "groomer")
    admins = sum(1 for u in users if u.role == "admin")
    activos = sum(1 for u in users if u.is_active)
    bloqueados = total - activos

    now = datetime.utcnow()
    d7 = now - timedelta(days=7)
    d30 = now - timedelta(days=30)
    nuevos_7 = sum(1 for u in users if getattr(u, "created_at", None) and u.created_at >= d7)
    nuevos_30 = sum(1 for u in users if getattr(u, "created_at", None) and u.created_at >= d30)

    solicitudes_pendientes = db.query(GroomerApplication).filter(
        GroomerApplication.status == ApplicationStatus.pending
    ).count()

    return AdminUserStatsOut(
        total=total,
        clientes=clientes,
        groomers=groomers,
        admins=admins,
        activos=activos,
        bloqueados=bloqueados,
        nuevos_7_dias=nuevos_7,
        nuevos_30_dias=nuevos_30,
        solicitudes_groomer_pendientes=solicitudes_pendientes,
    )


@router.put("/admin/users/{user_id}", response_model=AdminUserOut)
async def admin_update_user(
    user_id: int,
    user_update: AdminUserUpdate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Actualizar un usuario por admin (perfil, role, status)."""
    _require_admin(current_user, db)
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    update_data = user_update.dict(exclude_unset=True)
    # Nunca permitir cambiar email desde aquí (protección extra)
    update_data.pop("email", None)

    for field, value in update_data.items():
        setattr(user, field, value)

    db.commit()
    db.refresh(user)
    return user


@router.patch("/admin/users/{user_id}/role", response_model=AdminUserOut)
async def admin_update_user_role(
    user_id: int,
    payload: AdminUserRoleUpdate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Cambiar rol de un usuario (solo admin)."""
    _require_admin(current_user, db)
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    user.role = payload.role
    db.commit()
    db.refresh(user)
    return user


@router.patch("/admin/users/{user_id}/status", response_model=AdminUserOut)
async def admin_update_user_status(
    user_id: int,
    payload: AdminUserStatusUpdate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Bloquear/desbloquear usuario (solo admin)."""
    _require_admin(current_user, db)
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    user.is_active = payload.is_active
    db.commit()
    db.refresh(user)
    return user


@router.delete("/admin/users/{user_id}", response_model=dict)
async def admin_delete_user(
    user_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Eliminar usuario (solo admin)."""
    _require_admin(current_user, db)
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    db.delete(user)
    db.commit()
    return {"message": "Usuario eliminado"}

@router.get("/me", response_model=UserOut)
async def read_users_me(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        user = db.query(User).filter(User.email == current_user["email"]).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return UserOut(
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
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving user: {str(e)}"
        )

@router.get("/users/{email}", response_model=UserOut)
async def get_user_by_email(email: str, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    """Obtener un usuario por email"""
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return UserOut(
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
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving user: {str(e)}"
        )

@router.get("/internal/users/{email}", response_model=UserOut)
async def get_user_by_email_internal(email: str, db: Session = Depends(get_db)):
    """Endpoint interno para obtener un usuario por email sin autenticacion"""
    print(f"[DEBUG] Internal endpoint called with email: {email}")
    try:
        user = db.query(User).filter(User.email == email).first()
        print(f"[DEBUG] User found: {user}")
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return UserOut(
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
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving user: {str(e)}"
        )

@router.put("/me", response_model=UserOut)
async def update_user(
    user_update: UserUpdate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.email == current_user["email"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    update_data = user_update.dict(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(user, field, value)
    
    db.commit()
    db.refresh(user)
    
    return UserOut(
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


@router.post("/change-password")
async def change_password(
    password_data: PasswordChange,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Cambiar contrasena del usuario autenticado"""
    user = db.query(User).filter(User.email == current_user["email"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    if not verify_password(password_data.current_password, user.hashed_password):
        raise HTTPException(status_code=400, detail="La contrasena actual es incorrecta")
    
    user.hashed_password = get_password_hash(password_data.new_password)
    db.commit()
    
    return {"message": "Contrasena actualizada exitosamente"}


@router.post("/groomer-application", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_groomer_application(app_in: GroomerApplicationCreate, db: Session = Depends(get_db)):
    """Crear solicitud de registro para groomer (pendiente de aprobacion del admin)"""
    
    # Verificar si el email ya existe en usuarios o aplicaciones pendientes
    existing_user = db.query(User).filter(User.email == app_in.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El correo electronico ya esta registrado como usuario"
        )
    
    existing_app = db.query(GroomerApplication).filter(
        (GroomerApplication.email == app_in.email) & 
        (GroomerApplication.status == "pending")
    ).first()
    if existing_app:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya existe una solicitud pendiente con este correo"
        )
    
    hashed_password = get_password_hash(app_in.password)
    
    new_application = GroomerApplication(
        email=app_in.email,
        nombre_completo=app_in.nombre_completo,
        telefono=app_in.telefono,
        hashed_password=hashed_password,
        ciudad=app_in.ciudad,
        direccion=app_in.direccion,
        fecha_nacimiento=app_in.fecha_nacimiento,
        foto_url=app_in.foto_url,
        about_me=app_in.about_me,
        status="pending"
    )
    
    db.add(new_application)
    db.commit()
    db.refresh(new_application)
    
    return {
        "id": new_application.id,
        "message": "Solicitud de groomer creada exitosamente. Pendiente de revision por administrador.",
        "email": new_application.email
    }


@router.post('/uploads')
async def upload_file(request: Request, file: UploadFile = File(...)):
    """Recibe multipart/form-data con campo 'file', valida imagen, guarda en ./uploads y devuelve URL absoluta."""
    import re

    upload_dir = os.path.join(os.path.dirname(__file__), '..', 'uploads')
    os.makedirs(upload_dir, exist_ok=True)

    # Validar tipo
    content_type = file.content_type or ''
    if not content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail='Solo se permiten imagenes')

    contents = await file.read()
    # Limitar tamano a 2MB
    max_size = 2 * 1024 * 1024
    if len(contents) > max_size:
        raise HTTPException(status_code=400, detail='Imagen demasiado grande (max 2MB)')

    # Sanitizar nombre de archivo
    def _secure_filename(filename: str) -> str:
        name = os.path.basename(filename)
        name = re.sub(r'[^A-Za-z0-9_.-]', '_', name)
        return name

    safe_name = f"{int(datetime.utcnow().timestamp())}_{_secure_filename(file.filename or 'upload')}"
    path = os.path.join(upload_dir, safe_name)

    with open(path, 'wb') as f:
        f.write(contents)

    base = str(request.base_url).rstrip('/')
    file_url = f"{base}/uploads/files/{safe_name}"

    return {'url': file_url}


# Static files serving for development
from fastapi.staticfiles import StaticFiles
upload_static_dir = os.path.join(os.path.dirname(__file__), '..', 'uploads')
if not os.path.exists(upload_static_dir):
    os.makedirs(upload_static_dir, exist_ok=True)

router.mount('/uploads/files', StaticFiles(directory=upload_static_dir), name='uploads')


@router.get("/groomer-applications", response_model=list[GroomerApplicationOut])
async def get_groomer_applications(
    status_filter: str = "pending",
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obtener solicitudes de groomer (solo para admin)"""
    
    user = db.query(User).filter(User.email == current_user["email"]).first()
    if not user or user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo administradores pueden ver solicitudes"
        )
    
    query = db.query(GroomerApplication)
    if status_filter:
        query = query.filter(GroomerApplication.status == status_filter)
    
    applications = query.order_by(GroomerApplication.created_at.desc()).all()
    return applications


@router.get("/groomer-applications/{app_id}", response_model=GroomerApplicationOut)
async def get_groomer_application(
    app_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obtener detalle de solicitud de groomer"""
    
    user = db.query(User).filter(User.email == current_user["email"]).first()
    if not user or user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo administradores pueden ver solicitudes"
        )
    
    application = db.query(GroomerApplication).filter(GroomerApplication.id == app_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")
    
    return application


@router.post("/groomer-applications/{app_id}/approve", response_model=dict)
async def approve_groomer_application(
    app_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Aprobar solicitud de groomer y crear usuario"""
    
    admin = db.query(User).filter(User.email == current_user["email"]).first()
    if not admin or admin.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo administradores pueden aprobar solicitudes"
        )
    
    application = db.query(GroomerApplication).filter(GroomerApplication.id == app_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")
    
    if application.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"La solicitud ya fue {application.status}"
        )
    
    # Crear usuario groomer
    new_user = User(
        email=application.email,
        nombre_completo=application.nombre_completo,
        telefono=application.telefono,
        direccion=application.direccion,
        ciudad=application.ciudad,
        foto_url=application.foto_url,
        about_me=application.about_me,
        fecha_nacimiento=application.fecha_nacimiento,
        hashed_password=application.hashed_password,
        role="groomer",
        is_active=True
    )
    
    # Actualizar solicitud
    application.status = "approved"
    application.reviewed_by_admin_id = admin.id
    application.reviewed_at = datetime.utcnow()
    
    db.add(new_user)
    db.commit()
    db.refresh(application)
    
    return {
        "message": "Solicitud de groomer aprobada exitosamente",
        "user_id": new_user.id,
        "email": new_user.email
    }


@router.post("/groomer-applications/{app_id}/reject", response_model=dict)
async def reject_groomer_application(
    app_id: int,
    rejection: GroomerApplicationReject,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Rechazar solicitud de groomer"""
    
    admin = db.query(User).filter(User.email == current_user["email"]).first()
    if not admin or admin.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo administradores pueden rechazar solicitudes"
        )
    
    application = db.query(GroomerApplication).filter(GroomerApplication.id == app_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")
    
    if application.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"La solicitud ya fue {application.status}"
        )
    
    application.status = "rejected"
    application.rejection_reason = rejection.rejection_reason
    application.reviewed_by_admin_id = admin.id
    application.reviewed_at = datetime.utcnow()
    
    db.commit()
    
    return {
        "message": "Solicitud de groomer rechazada",
        "reason": rejection.rejection_reason
    }


@router.websocket("/ws/groomer-applications")
async def groomer_applications_ws(
    websocket: WebSocket,
    token: str
):
    """WebSocket: push de cambios en cantidad de solicitudes groomer pendientes (admin only)."""
    await websocket.accept()

    # Validate JWT manually (WebSocket doesn't support Authorization header via Depends easily)
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email = payload.get("sub")
        role = payload.get("role")
        if not email or role != "admin":
            await websocket.send_json({"type": "error", "detail": "Forbidden"})
            await websocket.close(code=1008)
            return
    except JWTError:
        await websocket.send_json({"type": "error", "detail": "Invalid token"})
        await websocket.close(code=1008)
        return

    db: Session = next(get_db())

    last_count = None
    try:
        while True:
            count = db.query(GroomerApplication).filter(GroomerApplication.status == "pending").count()
            if last_count is None or count != last_count:
                last_count = count
                await websocket.send_json({
                    "type": "pending_changed",
                    "pendingCount": count,
                    "timestamp": datetime.utcnow().isoformat()
                })

            # heartbeat-ish (keep connection alive and poll periodically)
            await asyncio.sleep(3)
    except WebSocketDisconnect:
        return
    finally:
        try:
            db.close()
        except Exception:
            pass

# ===== OAUTH ENDPOINTS =====

@router.get("/google/login")
async def google_oauth_login():
    """Redirige al usuario a Google para autenticaci�n OAuth."""
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


async def _process_google_oauth(code: str, db: Session) -> Token:
    """Helper function para procesar el callback de Google OAuth."""
    if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Google OAuth no configurado"
        )
    
    # Intercambiar el c�digo por un token de acceso
    import httpx
    async with httpx.AsyncClient() as client:
        token_response = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "code": code,
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
    
    # Obtener informaci�n del usuario
    async with httpx.AsyncClient() as client:
        user_info_response = await client.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {access_token}"}
        )
    
    if user_info_response.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Error al obtener informaci�n de usuario de Google"
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
    
    # Buscar usuario existente por email o provider_id
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
        hashed_password = get_password_hash(str(google_id))  # Usar Google ID como password inicial
        new_user = User(
            email=email,
            nombre_completo=nombre_completo,
            telefono="",  # Campo obligatorio pero Google no lo proporciona
            direccion="",  # Campo obligatorio pero Google no lo proporciona
            ciudad="",  # Campo obligatorio pero Google no lo proporciona
            foto_url=foto_url,
            about_me="",  # Campo opcional
            fecha_nacimiento=None,  # Campo opcional
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


@router.get("/google/callback", response_model=Token)
async def google_oauth_callback_get(code: str, state: str = None, db: Session = Depends(get_db)):
    """Procesa el callback de Google OAuth (m�todo GET) - flujo est�ndar de OAuth 2.0."""
    if not code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="C�digo de autorizaci�n no proporcionado"
        )
    
    return await _process_google_oauth(code, db)


@router.post("/google/callback", response_model=Token)
async def google_oauth_callback(callback: OAuthCallback, db: Session = Depends(get_db)):
    """Procesa el callback de Google OAuth (m�todo POST) - para compatibilidad con clientes que usan JSON."""
    return await _process_google_oauth(callback.code, db)


# ===== PASSWORD RESET ENDPOINTS =====

@router.post("/password-reset/request")
async def request_password_reset(request: PasswordResetRequest, db: Session = Depends(get_db)):
    """Solicita recuperaci�n de contrase�a enviando un token por email."""
    user = db.query(User).filter(User.email == request.email).first()
    
    if not user:
        # No revelar si el email existe o no por seguridad
        return {"message": "Si el email existe, recibir�s instrucciones para recuperar tu contrase�a"}
    
    # Generar token de recuperaci�n
    from datetime import datetime, timedelta
    from jose import jwt
    
    reset_token = jwt.encode(
        {
            "sub": user.email,
            "exp": datetime.utcnow() + timedelta(hours=settings.PASSWORD_RESET_TOKEN_EXPIRE_HOURS)
        },
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )
    
    # En un entorno real, aqu� se enviar�a el email con el token
    # Por ahora, simulamos el env�o retornando el token
    reset_url = f"{settings.FRONTEND_URL}/reset-password?token={reset_token}"
    
    # TODO: Implementar env�o real de email
    print(f"[PASSWORD RESET] Email: {user.email}, Reset URL: {reset_url}")
    
    return {
        "message": "Si el email existe, recibir�s instrucciones para recuperar tu contrase�a",
        "reset_url": reset_url  # Solo para desarrollo, remover en producci�n
    }


@router.post("/password-reset/confirm")
async def confirm_password_reset(confirm: PasswordResetConfirm, db: Session = Depends(get_db)):
    """Confirma el restablecimiento de contrase�a usando el token."""
    try:
        from jose import jwt
        from datetime import datetime
        
        payload = jwt.decode(
            confirm.token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        email = payload.get("sub")
        
        if not email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Token inv�lido"
            )
        
        user = db.query(User).filter(User.email == email).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado"
            )
        
        # Actualizar contrase�a
        user.hashed_password = get_password_hash(confirm.new_password)
        db.commit()
        db.refresh(user)
        
        return {"message": "Contrase�a actualizada exitosamente"}
        
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token expirado. Solicita una nueva recuperaci�n de contrase�a"
        )
    except jwt.JWTError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token inv�lido"
        )
