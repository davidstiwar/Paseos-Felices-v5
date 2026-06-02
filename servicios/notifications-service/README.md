# Notifications Service - Paseos Felices

Microservicio para el envío y gestión de notificaciones.

**Puerto:** 3008  
**Swagger:** http://localhost:3008/docs

## Funcionalidad

- Otros servicios pueden enviar notificaciones (appointment_confirmed, review_request, etc.)
- Los usuarios pueden ver sus notificaciones
- Marcar como leídas
- Contador de no leídas

## Endpoints principales

### POST /notifications/
Crear/enviar una notificación (usado internamente por otros servicios).

### GET /notifications/
Obtener mis notificaciones (ordenadas por fecha descendente).

### GET /notifications/unread-count
Obtener cantidad de notificaciones no leídas.

### PUT /notifications/{id}/read
Marcar una notificación como leída.

### DELETE /notifications/{id}
Eliminar una notificación.

## Tipos de notificación soportados

- `appointment_confirmed`
- `appointment_reminder`
- `appointment_cancelled`
- `review_request`
- `general`

## Notas

- Actualmente almacenamiento en memoria.
- En el futuro se puede extender a email, push notifications, etc.

## Cómo ejecutar

```powershell
docker compose up -d --build notifications-service   # desde servicios/
.\start.ps1
```
