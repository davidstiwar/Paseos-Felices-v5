# Appointments Service - Paseos Felices

Microservicio para la gestión de citas y reservas.

**Puerto:** 3003  
**Swagger:** http://localhost:3003/docs

## Endpoints

### POST /appointments
Crear una nueva cita (requiere estar logueado).

Body:
```json
{
  "pet_id": 1,
  "service": "Paseo Premium",
  "date": "2026-06-05",
  "time": "10:30",
  "notes": "Por favor llegar 5 min antes"
}
```

### GET /appointments
Lista las citas del cliente autenticado.

### GET /appointments/{id}
Detalle de una cita.

### PUT /appointments/{id}
Actualizar fecha, hora, notas o estado.

### DELETE /appointments/{id}
Cancelar una cita (marca como cancelled).

## Autenticación
Todos los endpoints requieren JWT del **auth-service** (puerto 8000).

## Notas actuales
- Almacenamiento en memoria
- Precios fijos por tipo de servicio
- pet_id es referencia al pets-service (aún no hay validación cruzada)

## Cómo ejecutar

### Con Docker (recomendado)

```powershell
# Desde la carpeta servicios/
docker compose up -d --build appointments-service
docker compose logs -f appointments-service
```

### Legacy (local)

```powershell
cd appointments-service
.\start.ps1
```
