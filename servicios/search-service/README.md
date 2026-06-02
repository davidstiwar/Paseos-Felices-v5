# Search / Indexing Service - Paseos Felices

Servicio opcional para búsquedas avanzadas. Utiliza índice en memoria para búsquedas de groomers, servicios y zonas.

Puerto: 3012

Endpoints:
- `POST /index` - indexar documento
- `GET /search?q=...` - búsqueda

Cómo ejecutar:
```powershell
cd servicios/search-service
.\start.ps1
```
