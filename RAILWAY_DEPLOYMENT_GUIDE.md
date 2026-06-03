# Guía de Despliegue en Railway - Paseos Felices v5

## 📋 Resumen
Esta guía te ayudará a desplegar todos los microservicios FastAPI en Railway usando docker-compose.yml.

## 🏗️ Arquitectura
- **Frontend**: React en Vercel (ya configurado)
- **Backend**: 12 microservicios FastAPI en Railway
- **Base de Datos**: MySQL en Railway (incluido en docker-compose.yml)

## 📦 Servicios a Desplegar
1. mysql (base de datos)
2. auth-service (puerto 8000)
3. services-catalog-service (puerto 3014)
4. appointments-service (puerto 3023)
5. reviews-service (puerto 3007)
6. pets-service (puerto 3022)
7. groomer-service (puerto 3010)
8. user-profile-service (puerto 3015)
9. notifications-service (puerto 3016)
10. storage-service (puerto 3017)
11. email-service (puerto 3018)
12. search-service (puerto 3019)
13. reporting-service (puerto 3020)

## 🚀 Pasos de Despliegue

### Paso 1: Crear Cuenta en Railway
1. Ve a [railway.app](https://railway.app/) y crea una cuenta
2. Conecta tu cuenta de GitHub/GitLab/Bitbucket

### Paso 2: Crear Nuevo Proyecto en Railway
1. Haz clic en "New Project"
2. Selecciona "Deploy from GitHub repo"
3. Busca y selecciona tu repositorio: `davidstiwar/Paseos-Felices-v5`
4. Railway detectará automáticamente el archivo `docker-compose.yml`

### Paso 3: Configurar Variables de Entorno
Railway leerá automáticamente las variables de entorno de `docker-compose.yml`. Sin embargo, necesitas configurar algunas variables adicionales:

#### Variables Comunes para Todos los Servicios:
- `FRONTEND_URL`: `https://paseos-felices-v5.vercel.app`
- `ENVIRONMENT`: `production`

#### Variables para auth-service:
- `SECRET_KEY`: (genera uno seguro usando: `openssl rand -hex 32`)
- `ACCESS_TOKEN_EXPIRE_MINUTES`: `10080`

#### Variables para Email Service (opcional):
- `SMTP_SERVER`: `smtp.gmail.com`
- `SMTP_PORT`: `587`
- `SMTP_USER`: `tu_email@gmail.com`
- `SMTP_PASSWORD`: `tu_contraseña`
- `SMTP_FROM`: `noreply@paseofelices.com`

### Paso 4: Ejecutar el Script SQL
Railway creará automáticamente la base de datos MySQL. Necesitas ejecutar el script SQL:

1. Ve al servicio MySQL en Railway
2. Haz clic en "Connect" para obtener la cadena de conexión
3. Conéctate a la base de datos usando un cliente MySQL (DBeaver, MySQL Workbench, etc.)
4. Ejecuta el script `servicios/mysql-setup.sql`

### Paso 5: Verificar el Despliegue
1. **Verifica el health check de cada servicio:**
   - `https://auth-service-url.railway.app/health`
   - `https://services-catalog-url.railway.app/health`
   - ...etc

2. **Revisa los logs en Railway** para detectar errores

3. **Prueba la API** usando Postman o el frontend

### Paso 6: Actualizar el Frontend (Vercel)
Una vez que todos los servicios estén desplegados en Railway, obtén las URLs de cada servicio y actualiza tu frontend React.

## 🔧 Solución de Problemas

### Error: "Service failed to start"
- Revisa los logs del servicio específico
- Verifica que el Dockerfile sea correcto
- Asegúrate de que el puerto no esté en conflicto

### Error: "Connection refused" a MySQL
- Verifica que el servicio MySQL esté corriendo
- Confirma que las credenciales sean correctas
- Asegúrate de que el script SQL se ejecutó

### Error: "Port already in use"
- Railway asigna puertos automáticamente
- No uses puertos fijos en el código, usa variables de entorno

### Error: CORS
- Verifica que `FRONTEND_URL` esté configurado correctamente
- Asegúrate de que la URL del frontend esté en la lista `allow_origins`

### Build falla
- Revisa los logs de build en Railway
- Verifica que el Dockerfile sea correcto
- Asegúrate de que las dependencias estén en requirements.txt

## 💰 Costos

- **Railway**: Plan gratuito incluye $5 de crédito mensual (suficiente para desarrollo)
- **MySQL**: Incluido en Railway
- **Vercel**: Plan gratuito para frontend

## 📝 Notas Importantes

1. **Plan gratuito de Railway** tiene limitaciones:
   - Los servicios se "duermen" después de 1 hora de inactividad
   - Primer arranque puede tardar hasta 30 segundos
   - Límite de 500MB RAM por servicio

2. **Para producción**, considera:
   - Plan pago de Railway ($5/mes por servicio)
   - MySQL con alta disponibilidad
   - Configurar health checks personalizados
   - Monitoreo y alertas

3. **Seguridad**:
   - Nunca commits secrets en el repositorio
   - Usa variables de entorno para credenciales
   - Genera `SECRET_KEY` seguro para JWT
   - Configura SSL/TLS para todas las conexiones

## 🎯 Checklist de Despliegue

- [ ] Cuenta en Railway creada
- [ ] Repositorio conectado a Railway
- [ ] docker-compose.yml detectado por Railway
- [ ] Variables de entorno configuradas
- [ ] Script SQL ejecutado en MySQL
- [ ] Health checks funcionando
- [ ] Frontend actualizado con URLs de Railway
- [ ] Pruebas de integración completadas
- [ ] Logs revisados sin errores críticos

## 📞 Recursos Útiles

- [Documentación de Railway](https://docs.railway.app)
- [Railway Docker Compose](https://docs.railway.app/deploy/docker-compose)
- [FastAPI Deployment](https://fastapi.tiangolo.com/deployment/)
- [Docker Compose Reference](https://docs.docker.com/compose/)

## 🔄 Actualización Continua

Para actualizar los servicios:
1. Haz push al repositorio
2. Railway detectará los cambios y redeployará automáticamente
3. Monitorea los logs para verificar el éxito
