# Reviews Service - Paseos Felices

Microservicio para la gestión de reseñas y calificaciones de groomers.

**Puerto:** 3007  
**Swagger:** http://localhost:3007/docs

## Funcionalidad

- Clientes pueden dejar reseñas a groomers después de una cita.
- Rating de 1 a 5 estrellas + comentario opcional.
- Listar reseñas por groomer.
- Actualizar o eliminar reseña (solo el autor).

## Endpoints principales

### POST /reviews/
Crear una nueva reseña.

### GET /reviews/groomer/{groomer_id}
Obtener todas las reseñas de un groomer.

### PUT /reviews/{id}
Editar una reseña (solo el autor).

### DELETE /reviews/{id}
Eliminar una reseña (solo el autor).

## Notas

- Persistencia en MySQL (XAMPP) usando `DATABASE_URL` (por defecto: `paseos_reviews`).
- En el futuro se puede integrar mejor con `appointments-service` para validar que la cita existió.
- La calificación promedio del groomer se puede calcular aquí o en el groomer-service.

## Cómo ejecutar

```powershell
docker compose up -d --build reviews-service   # desde servicios/
.\start.ps1
```
