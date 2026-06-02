# Guía de Despliegue en Render - Paseos Felices v5

## 📋 Resumen
Esta guía te ayudará a desplegar todos los microservicios FastAPI en Render con MySQL externo.

## 🏗️ Arquitectura
- **Frontend**: React en Vercel (ya configurado)
- **Backend**: 12 microservicios FastAPI en Render
- **Base de Datos**: MySQL externo (PlanetScale, Railway, AWS RDS, etc.)

## 📦 Servicios a Desplegar
1. paseos-auth-service (puerto 8000)
2. paseos-services-catalog (puerto 3014)
3. paseos-appointments (puerto 3023)
4. paseos-reviews (puerto 3007)
5. paseos-pets (puerto 3022)
6. paseos-groomer (puerto 3010)
7. paseos-user-profile (puerto 3015)
8. paseos-notifications (puerto 3016)
9. paseos-storage (puerto 3017)
10. paseos-email (puerto 3018)
11. paseos-search (puerto 3019)
12. paseos-reporting (puerto 3020)

## 🚀 Pasos de Despliegue

### Paso 1: Configurar MySQL Externo

#### Opción A: PlanetScale (Recomendado - Gratis)
1. Ve a [PlanetScale](https://planetscale.com/) y crea una cuenta
2. Crea una nueva base de datos llamada `paseos_felices`
3. Crea las bases de datos individuales:
   - paseos_auth
   - paseos_services_catalog
   - paseos_appointments
   - paseos_reviews
   - paseos_pets
   - paseos_groomer
   - paseos_user_profile
   - paseos_notifications
   - paseos_reporting
4. Obtén la cadena de conexión: `mysql://usuario:password@host:puerto/database`
5. Copia el archivo `servicios/mysql-setup.sql` y ejecútalo en cada base de datos

#### Opción B: Railway (MySQL)
1. Ve a [Railway](https://railway.app/) y crea una cuenta
2. Crea un nuevo proyecto MySQL
3. Obtén la cadena de conexión desde la pestaña de variables
4. Ejecuta el script SQL en la base de datos

#### Opción C: AWS RDS / Google Cloud SQL
1. Crea una instancia MySQL
2. Configura las reglas de firewall para permitir conexiones desde Render
3. Ejecuta el script SQL
4. Obtén la cadena de conexión

### Paso 2: Preparar el Repositorio

1. **Asegúrate de que tu repositorio esté en GitHub/GitLab/Bitbucket**

2. **Verifica que cada servicio tenga:**
   - `main.py` en la raíz del servicio
   - `requirements.txt` con las dependencias
   - Estructura de carpetas correcta

3. **Confirma el archivo `render.yaml`** (ya creado en la raíz del proyecto)

### Paso 3: Conectar Render con tu Repositorio

1. Ve a [render.com](https://render.com) y crea una cuenta
2. Haz clic en "New +" → "Web Service"
3. Conecta tu repositorio (GitHub/GitLab/Bitbucket)
4. Render detectará automáticamente el archivo `render.yaml`
5. Haz clic en "Apply existing render.yaml"

### Paso 4: Configurar Variables de Entorno

Render creará automáticamente los 12 servicios. Para cada servicio, configura:

#### Variables Comunes para Todos los Servicios:
- `FRONTEND_URL`: `https://paseos-felices-v5.vercel.app`
- `ENVIRONMENT`: `production`

#### Variables para Servicios con Base de Datos:

**Para paseos-auth-service:**
- `DATABASE_URL`: `mysql+pymysql://usuario:password@host:puerto/paseos_auth`
- `SECRET_KEY`: (genera uno seguro, usa: `openssl rand -hex 32`)
- `ACCESS_TOKEN_EXPIRE_MINUTES`: `10080`
- `DEBUG`: `false`

**Para paseos-services-catalog:**
- `DATABASE_URL`: `mysql+pymysql://usuario:password@host:puerto/paseos_services_catalog`

**Para paseos-appointments:**
- `DATABASE_URL`: `mysql+pymysql://usuario:password@host:puerto/paseos_appointments`

**Para paseos-reviews:**
- `DATABASE_URL`: `mysql+pymysql://usuario:password@host:puerto/paseos_reviews`

**Para paseos-pets:**
- `DATABASE_URL`: `mysql+pymysql://usuario:password@host:puerto/paseos_pets`

**Para paseos-groomer:**
- `DATABASE_URL`: `mysql+pymysql://usuario:password@host:puerto/paseos_groomer`

**Para paseos-user-profile:**
- `DATABASE_URL`: `mysql+pymysql://usuario:password@host:puerto/paseos_user_profile`

**Para paseos-notifications:**
- `DATABASE_URL`: `mysql+pymysql://usuario:password@host:puerto/paseos_notifications`

**Para paseos-reporting:**
- `DATABASE_URL`: `mysql+pymysql://usuario:password@host:puerto/paseos_reporting`

#### Servicios sin Base de Datos:
- paseos-storage
- paseos-email
- paseos-search

Estos solo necesitan `FRONTEND_URL` y `ENVIRONMENT`.

### Paso 5: Ejecutar el Script SQL en MySQL

1. Conéctate a tu base de datos MySQL externa
2. Ejecuta el script `servicios/mysql-setup.sql`
3. Verifica que todas las tablas se crearon correctamente

### Paso 6: Actualizar el Frontend (Vercel)

Una vez que todos los servicios estén desplegados en Render, obtén las URLs de cada servicio:

```
https://paseos-auth-service.onrender.com
https://paseos-services-catalog.onrender.com
https://paseos-appointments.onrender.com
...etc
```

Actualiza las URLs en tu frontend React para apuntar a los servicios de Render.

### Paso 7: Verificar el Despliegue

1. **Verifica el health check de cada servicio:**
   - `https://paseos-auth-service.onrender.com/health`
   - `https://paseos-services-catalog.onrender.com/health`
   - ...etc

2. **Revisa los logs en Render** para detectar errores

3. **Prueba la API** usando Postman o el frontend

## 🔧 Solución de Problemas

### Error: "ModuleNotFoundError"
- Verifica que `requirements.txt` esté en cada servicio
- Asegúrate de que todas las dependencias estén listadas

### Error: "Connection refused" a MySQL
- Verifica que la cadena de conexión sea correcta
- Confirma que el firewall de MySQL permita conexiones desde Render
- PlanetScale requiere SSL: agrega `?ssl_ca=/etc/ssl/cert.pem` a la URL

### Error: "Port already in use"
- Render asigna puertos automáticamente mediante la variable `$PORT`
- No uses puertos fijos en el código, usa `settings.PORT` o `$PORT`

### Error: CORS
- Verifica que `FRONTEND_URL` esté configurado correctamente
- Asegúrate de que la URL del frontend esté en la lista `allow_origins`

### Build falla
- Revisa los logs de build en Render
- Verifica que Python versión sea compatible (3.11+)
- Asegúrate de que el directorio de trabajo sea correcto

## 💰 Costos

- **Render**: Plan gratuito incluye 750 horas/mes (suficiente para desarrollo)
- **MySQL Externo**: Depende del proveedor (PlanetScale tiene plan gratuito)
- **Vercel**: Plan gratuito para frontend

## 📝 Notas Importantes

1. **Plan gratuito de Render** tiene limitaciones:
   - Los servicios se "duermen" después de 15 minutos de inactividad
   - Primer arranque puede tardar hasta 50 segundos
   - Límite de 512MB RAM por servicio

2. **Para producción**, considera:
   - Plan pago de Render ($7/mes por servicio)
   - MySQL con alta disponibilidad
   - Configurar health checks personalizados
   - Monitoreo y alertas

3. **Seguridad**:
   - Nunca commits secrets en el repositorio
   - Usa variables de entorno para credenciales
   - Genera `SECRET_KEY` seguro para JWT
   - Configura SSL/TLS para todas las conexiones

## 🎯 Checklist de Despliegue

- [ ] MySQL externo configurado y accesible
- [ ] Script SQL ejecutado en todas las bases de datos
- [ ] Repositorio conectado a Render
- [ ] render.yaml confirmado en el repositorio
- [ ] 12 servicios creados en Render
- [ ] Variables de entorno configuradas para cada servicio
- [ ] Health checks funcionando
- [ ] Frontend actualizado con URLs de Render
- [ ] Pruebas de integración completadas
- [ ] Logs revisados sin errores críticos

## 📞 Recursos Útiles

- [Documentación de Render](https://render.com/docs)
- [Render Blueprint Spec](https://render.com/docs/blueprint-spec)
- [PlanetScale Documentation](https://docs.planetscale.com)
- [FastAPI Deployment](https://fastapi.tiangolo.com/deployment/)

## 🔄 Actualización Continua

Para actualizar los servicios:
1. Haz push al repositorio
2. Render detectará los cambios y redeployará automáticamente
3. Monitorea los logs para verificar el éxito
