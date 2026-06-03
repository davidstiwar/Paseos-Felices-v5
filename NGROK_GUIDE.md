# Guía para usar Paseos Felices con ngrok

## ¿Qué es ngrok?
ngrok es una herramienta que expone servicios locales a internet a través de túneles seguros. Es útil para:
- Probar la app desde dispositivos externos
- Compartir el desarrollo con otros
- Probar webhooks y callbacks

## Requisitos Previos
- Docker instalado (para MySQL)
- Python 3.11+ instalado
- ngrok instalado (descargar desde https://ngrok.com/download)
- Cuenta gratuita en ngrok

## Pasos para Iniciar

### 1. Iniciar MySQL con Docker
```powershell
docker run -d --name paseos-mysql -e MYSQL_ROOT_PASSWORD=root -e MYSQL_DATABASE=paseos_auth -p 3306:3306 mysql:8.0
```

### 2. Ejecutar Script SQL
```powershell
docker exec -i paseos-mysql mysql -uroot -proot paseos_auth < servicios/mysql-setup.sql
```

### 3. Iniciar Servicios
```powershell
.\start-with-ngrok.ps1
```

Este script:
- Inicia MySQL con Docker
- Ejecuta el script SQL
- Inicia nginx como proxy inverso
- Inicia todos los microservicios en sus puertos correspondientes

### 4. Iniciar ngrok
```powershell
ngrok http 80
```

Esto expondrá el puerto 80 (nginx) a internet a través de una URL como:
`https://xxxx-xx-xx-xx-xx.ngrok-free.app`

### 5. Actualizar FRONTEND_URL
Copia la URL de ngrok y actualiza la variable de entorno `FRONTEND_URL` en cada servicio:
```powershell
$env:FRONTEND_URL = "https://xxxx-xx-xx-xx-xx.ngrok-free.app"
```

O actualízala en el archivo `.env` si usas variables de entorno.

## Estructura de URLs con ngrok

Con nginx como proxy inverso, las URLs serán:
- Auth: `https://xxxx.ngrok-free.app/auth/`
- Services Catalog: `https://xxxx.ngrok-free.app/services-catalog/`
- Appointments: `https://xxxx.ngrok-free.app/appointments/`
- Reviews: `https://xxxx.ngrok-free.app/reviews/`
- Pets: `https://xxxx.ngrok-free.app/pets/`
- Groomer: `https://xxxx.ngrok-free.app/groomer/`
- User Profile: `https://xxxx.ngrok-free.app/user-profile/`
- Notifications: `https://xxxx.ngrok-free.app/notifications/`
- Storage: `https://xxxx.ngrok-free.app/storage/`
- Email: `https://xxxx.ngrok-free.app/email/`
- Search: `https://xxxx.ngrok-free.app/search/`
- Reporting: `https://xxxx.ngrok-free.app/reporting/`

## Actualizar Frontend

Actualiza las URLs en tu frontend React para usar las URLs de ngrok:

```javascript
const API_BASE_URL = 'https://xxxx.ngrok-free.app';
```

## Detener Servicios

Para detener todo:
1. Detén ngrok (Ctrl+C)
2. Detén nginx:
```powershell
nginx -s stop
```
3. Detén los servicios de Python (Ctrl+C en cada terminal)
4. Detén MySQL:
```powershell
docker stop paseos-mysql
docker rm paseos-mysql
```

## Solución de Problemas

### Error: "Address already in use"
Un puerto ya está en uso. Verifica qué proceso está usando el puerto y deténlo:
```powershell
netstat -ano | findstr :8000
```

### Error: "Connection refused"
Asegúrate de que MySQL esté corriendo:
```powershell
docker ps
```

### ngrok no funciona
Asegúrate de tener ngrok instalado y autenticado:
```powershell
ngrok version
ngrok config check
```

### CORS errors
Los servicios ya están configurados para aceptar URLs de ngrok (`*ngrok-free.app` y `*ngrok.io`). Si aún tienes errores, verifica que la URL de ngrok esté en la lista de `allow_origins`.

## Notas Importantes

- Las URLs de ngrok cambian cada vez que reinicias ngrok (a menos que uses un dominio personalizado)
- El plan gratuito de ngrok tiene limitaciones de tiempo y conexiones
- Para producción, usa Railway, Render, u otro servicio de hosting
- ngrok es ideal para desarrollo y pruebas, no para producción
