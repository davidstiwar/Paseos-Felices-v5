# Pets Service - Paseos Felices (Microservicio)

Microservicio independiente para la gestión de mascotas de los clientes.

**Puerto por defecto:** 3002  
**Swagger:** http://localhost:3002/docs

## Endpoints

### POST /pets
Crear una nueva mascota para el usuario autenticado.

Body:
```json
{
  "name": "Max",
  "breed": "Golden Retriever",
  "age": 3
}
```

### GET /pets
Lista todas las mascotas del usuario autenticado (según el JWT).

### GET /pets/{id}
Obtener una mascota específica (solo si es del usuario).

### PUT /pets/{id}
Actualizar datos de la mascota.

### DELETE /pets/{id}
Eliminar una mascota.

## Autenticación
Todos los endpoints requieren el header:
```
Authorization: Bearer <token>
```
El token se obtiene del **auth-service** (puerto 8000).

## Cómo correr

```powershell
cd pets-service
.\start.ps1
```

O manualmente:
```powershell
cd pets-service
.\venv\Scripts\Activate.ps1
uvicorn main:app --reload --port 3002
```

## Notas de arquitectura (Microservices)

- Este servicio es **independiente** del auth-service.
- Valida el JWT usando la misma `SECRET_KEY`.
- En producción real se recomendaría:
  - Base de datos propia
  - Comunicación vía API Gateway
  - Docker + docker-compose
  - Service discovery

## Estado actual
- Almacenamiento en memoria (se pierde al reiniciar)
- Listo para conectar con el frontend (MyPets, RegisterPet, EditPet)
