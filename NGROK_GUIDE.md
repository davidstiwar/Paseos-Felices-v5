# Guía para usar Paseos Felices con ngrok

## ¿Qué es ngrok?
ngrok es una herramienta que expone servicios locales a internet a través de túneles seguros. Es útil para:
- Probar la app desde dispositivos externos
- Compartir el desarrollo con otros
- Probar webhooks y callbacks

## Requisitos Previos
- MySQL local instalado y corriendo (o Docker si prefieres)
- Python 3.11+ instalado
- ngrok instalado (descargar desde https://ngrok.com/download)
- Cuenta gratuita en ngrok

## Pasos para Iniciar (Versión Simplificada)

### 1. Configurar MySQL

**Opción A: XAMPP (Recomendado)**
Si tienes XAMPP instalado:
1. Inicia Apache y MySQL desde XAMPP Control Panel
2. Ve a phpMyAdmin: http://localhost/phpmyadmin
3. Crea la base de datos `paseos_auth`
4. Ejecuta el script SQL:
```powershell
mysql -u root paseos_auth < servicios/mysql-setup.sql
```

**Opción B: MySQL Local**
Si tienes MySQL instalado localmente:
```sql
CREATE DATABASE paseos_auth;
```
Luego ejecuta el script SQL:
```powershell
mysql -u root -p paseos_auth < servicios/mysql-setup.sql
```

**Opción C: MySQL con Docker**
```powershell
docker run -d --name paseos-mysql -e MYSQL_ROOT_PASSWORD=root -e MYSQL_DATABASE=paseos_auth -p 3306:3306 mysql:8.0
docker exec -i paseos-mysql mysql -uroot -proot paseos_auth < servicios/mysql-setup.sql
```

### 2. Iniciar Servicios
```powershell
.\start-services.ps1
```

Este script:
- Crea entornos virtuales automáticamente si no existen
- Instala dependencias
- Inicia todos los microservicios en sus puertos correspondientes
- No requiere Docker ni nginx

### 3. Iniciar ngrok

**Opción A: Un solo servicio**
```powershell
ngrok http 8000
```
Esto expondrá solo el auth-service.

**Opción B: Múltiples servicios (ngrok Pro)**
Crea un archivo `ngrok.yml`:
```yaml
tunnels:
  auth:
    addr: 8000
    proto: http
  services-catalog:
    addr: 3014
    proto: http
  appointments:
    addr: 3023
    proto: http
```
Luego ejecuta:
```powershell
ngrok start --all
```

### 4. Actualizar FRONTEND_URL
Copia la URL de ngrok y actualiza la variable de entorno:
```powershell
$env:FRONTEND_URL = "https://xxxx-xx-xx-xx-xx.ngrok-free.app"
```

## Estructura de Puertos

- Auth: `localhost:8000`
- Services Catalog: `localhost:3014`
- Appointments: `localhost:3023`
- Reviews: `localhost:3007`
- Pets: `localhost:3022`
- Groomer: `localhost:3010`
- User Profile: `localhost:3015`
- Notifications: `localhost:3016`
- Storage: `localhost:3017`
- Email: `localhost:3018`
- Search: `localhost:3019`
- Reporting: `localhost:3020`

## Actualizar Frontend

Actualiza las URLs en tu frontend React para usar las URLs de ngrok:

```javascript
const API_BASE_URL = 'https://xxxx.ngrok-free.app';
// O para desarrollo local:
const API_BASE_URL = 'http://localhost:8000';
```

## Detener Servicios

Presiona cualquier tecla en la terminal donde ejecutaste `start-services.ps1` para detener todos los servicios automáticamente.

O manualmente:
```powershell
Get-Process python | Stop-Process -Force
```

## Solución de Problemas

### Error: "Address already in use"
Un puerto ya está en uso. Verifica qué proceso está usando el puerto:
```powershell
netstat -ano | findstr :8000
```

### Error: "Connection refused"
Asegúrate de que MySQL esté corriendo:
```powershell
# MySQL local
mysql -u root -p -e "SELECT 1"

# Docker
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
- El script `start-services.ps1` crea entornos virtuales automáticamente
