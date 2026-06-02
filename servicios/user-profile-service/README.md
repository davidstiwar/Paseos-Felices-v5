# User Profile Service - Paseos Felices

Microservicio para perfiles extendidos de usuarios (clientes y groomers).

**Puerto:** 3009  
**Swagger:** http://localhost:3009/docs

## Funcionalidad

- Datos adicionales del usuario que no pertenecen a autenticación.
- Información de contacto, dirección, zonas preferidas, foto de perfil, bio, etc.

## Endpoints principales

### GET /profiles/me
Obtiene el perfil del usuario autenticado.

### PUT /profiles/me
Actualiza o crea el perfil del usuario autenticado.

### GET /profiles/{email}
Obtiene el perfil de otro usuario (por email).

## Campos principales

- `full_name`
- `phone`
- `address`
- `city`
- `preferred_zones` (lista)
- `bio`
- `profile_picture_url`

## Notas

- Este servicio complementa a `auth-service`.
- En el futuro, el `groomer-service` podría consumir datos de este servicio.
- Actualmente usa almacenamiento en memoria.

## Cómo ejecutar

```powershell
cd servicios/user-profile-service
.\start.ps1
```
