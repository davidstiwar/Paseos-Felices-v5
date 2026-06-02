# Media / File Storage Service - Paseos Felices

Servicio para subir/servir fotos. Utiliza almacenamiento local (/tmp/paseos-storage).

Puerto: 3011

Endpoints:
- `POST /upload` - subir archivo (multipart)
- `GET /health` - estado

Cómo ejecutar:
```powershell
cd servicios/storage-service
.\start.ps1
```
