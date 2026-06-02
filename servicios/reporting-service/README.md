# Reporting / Analytics Service - Paseos Felices

Servicio para generación de reportes y métricas (ingresos, uso). Recibe eventos y genera reportes simples.

Puerto: 3013

Endpoints:
- `GET /metrics` - métricas básicas (ej: número de citas)
- `GET /report?from=YYYY-MM-DD&to=YYYY-MM-DD` - reporte simple

Cómo ejecutar:
```powershell
cd servicios/reporting-service
.\start.ps1
```
