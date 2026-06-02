# Services Catalog Service - Paseos Felices

Microservicio para el catálogo central de servicios ofrecidos por la plataforma.

**Puerto:** 3004  
**Swagger:** http://localhost:3004/docs

## Endpoints

### GET /catalog/
Lista todos los servicios (público).  
Query param: `active_only=true` (por defecto).

### GET /catalog/{id}
Obtiene un servicio específico.

### POST /catalog/
Crea un nuevo servicio en el catálogo (requiere autenticación).

### PUT /catalog/{id}
Actualiza un servicio.

### DELETE /catalog/{id}
Elimina un servicio del catálogo.

## Modelo de Servicio

- `name`: Nombre del servicio (ej: "Paseo Premium")
- `category`: paseo | grooming | entrenamiento | cuidado_casa | otro
- `base_price`: Precio base
- `duration_minutes`: Duración en minutos
- `description`
- `is_active`

## Notas

- Este servicio es la fuente de verdad para los tipos de servicios.
- El `appointments-service` y `groomer-service` deberían referenciar estos IDs en el futuro.
- Actualmente usa almacenamiento en memoria.

## Cómo ejecutar

```powershell
cd servicios/services-catalog-service
.\start.ps1
```
