# Email / Messaging Service - Paseos Felices

Microservicio para envío de emails (confirmaciones, reseteo de contraseña) y pasarela a proveedores como SendGrid o AWS SES.

Puerto: 3010

Endpoints:
- `POST /send` - enviar un email (payload: to, subject, body, html)
- `GET /health` - estado

### Ejecutar con Docker

```powershell
# Desde la carpeta servicios/
docker compose up -d --build email-service
docker compose logs -f email-service
```

### Legacy local

```powershell
cd email-service
.\start.ps1
```

Configuración (ver `.env.example`) incluye `SENDGRID_API_KEY`, `SES_*` o `SMTP_*`.
