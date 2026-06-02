# Groomer Service - Paseos Felices

Microservicio para la gestión de perfiles de groomers y paseadores.

**Puerto:** 3005  
**Swagger:** http://localhost:3005/docs

## Funcionalidades

- Creación y gestión de perfiles de groomers
- Asociación de servicios que ofrecen (vinculado a services-catalog-service)
- Zonas de cobertura
- Datos profesionales (bio, teléfono, calificación)
- Activación/desactivación de perfiles

## Endpoints principales

### GET /groomers/
Lista todos los groomers activos.

### GET /groomers/{id}
Obtiene un groomer específico.

### POST /groomers/
Crea un nuevo perfil de groomer (requiere autenticación).

### PUT /groomers/{id}
Actualiza el perfil (solo el dueño).

### DELETE /groomers/{id}
Elimina el perfil.

## Notas de arquitectura

- Este servicio depende de `services-catalog-service` para los IDs de servicios.
- Más adelante se integrará con `availability-service` para horarios.
- La calificación promedio se actualizará desde el servicio de reseñas.

## Cómo ejecutar

### Docker (recomendado)

```powershell
docker compose up -d --build groomer-service
```

### Legacy

```powershell
cd groomer-service
.\start.ps1
```
