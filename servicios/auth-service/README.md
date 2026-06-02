# Auth Service - Paseos Felices (Microservicio)

Microservicio independiente para autenticación y registro de usuarios.

**Puerto por defecto:** 8000  
**Swagger:** http://localhost:8000/docs

## Endpoints principales

### POST /auth/register
Registra un nuevo usuario (rol por defecto: `cliente`).

Incluye el campo **direccion**.

### POST /auth/login
Inicia sesión y devuelve JWT + datos del usuario.

### GET /auth/me
Devuelve el usuario autenticado (requiere token).

## Autenticación
- Usa JWT (HS256)
- Mismo `SECRET_KEY` que usan los demás microservicios (pets-service, etc.)

## Cómo correr

```powershell
cd auth-service
.\start.ps1
```

O manualmente:
```powershell
cd auth-service
.\venv\Scripts\Activate.ps1
uvicorn main:app --reload --port 8000
```

## Estado actual
- Almacenamiento en memoria (ideal para desarrollo)
- Soporta: Login, Register (con dirección), /me
- Listo para ser consumido por el frontend y otros microservicios

## Ejecutar con Docker (recomendado)

Desde la carpeta `servicios/`:

```powershell
# Levantar solo este servicio + dependencias
docker compose up -d --build auth-service

# Ver logs
docker compose logs -f auth-service

# Ver healthcheck
docker inspect --format='{{.State.Health.Status}}' paseos-auth
```

El servicio responde en:
- `http://localhost:8000`
- `http://localhost:8000/health`
- `http://localhost:8000/docs`

## Notas de microservicios
Este servicio es el **único** que debe manejar contraseñas y generación de tokens.
Los demás servicios (pets, appointments, etc.) solo validan el JWT.
