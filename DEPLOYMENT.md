# Guía de Despliegue - Paseos Felices v5

## Arquitectura del Proyecto

Este proyecto utiliza una arquitectura de microservicios:
- **Frontend:** React (se despliega en Vercel)
- **Backend:** FastAPI con múltiples microservicios (se despliegan en Railway/Render)
- **Base de datos:** MySQL (se despliega en Railway/PlanetScale)

## 1. Despliegue del Frontend en Vercel

### Pasos:

1. **Conectar repositorio a Vercel:**
   - Ve a [vercel.com](https://vercel.com)
   - Importa tu repositorio de GitHub
   - Configura el directorio raíz: `frontend`

2. **Configurar variables de entorno en Vercel:**
   ```
   REACT_APP_AUTH_SERVICE_URL=https://tu-auth-service-url.railway.app
   REACT_APP_SERVICES_CATALOG_URL=https://tu-services-catalog-url.railway.app
   REACT_APP_APPOINTMENTS_SERVICE_URL=https://tu-appointments-service-url.railway.app
   REACT_APP_REVIEWS_SERVICE_URL=https://tu-reviews-service-url.railway.app
   REACT_APP_PETS_SERVICE_URL=https://tu-pets-service-url.railway.app
   ```

3. **Desplegar:**
   - Vercel detectará automáticamente que es un proyecto React
   - Usará el comando `npm run build`
   - El directorio de salida será `build`

## 2. Despliegue de Microservicios en Railway

### Pasos:

1. **Crear cuenta en Railway:**
   - Ve a [railway.app](https://railway.app)
   - Conecta tu repositorio de GitHub

2. **Desplegar cada microservicio:**
   - Crea un nuevo proyecto por cada servicio:
     - Auth Service (puerto 8000)
     - Services Catalog Service (puerto 3014)
     - Appointments Service (puerto 3023)
     - Reviews Service (puerto 3007)
     - Pets Service (puerto 3022)

3. **Configurar variables de entorno para cada servicio:**

   **Auth Service:**
   ```
   DATABASE_URL=mysql+pymysql://root:password@host:3306/paseos_auth
   GOOGLE_CLIENT_ID=tu_google_client_id
   GOOGLE_CLIENT_SECRET=tu_google_client_secret
   GOOGLE_REDIRECT_URI=https://tu-vercel-url.vercel.app/auth/google/callback
   FRONTEND_URL=https://tu-vercel-url.vercel.app
   ```

   **Services Catalog Service:**
   ```
   DATABASE_URL=mysql+pymysql://root:password@host:3306/paseos_services_catalog
   ```

   **Appointments Service:**
   ```
   DATABASE_URL=mysql+pymysql://root:password@host:3306/paseos_appointments
   ```

   **Reviews Service:**
   ```
   DATABASE_URL=mysql+pymysql://root:password@host:3306/paseos_reviews
   ```

   **Pets Service:**
   ```
   DATABASE_URL=mysql+pymysql://root:password@host:3306/paseos_pets
   ```

4. **Configurar el comando de inicio:**
   - Railway detectará automáticamente que es un proyecto Python
   - Asegúrate de tener un `requirements.txt` en cada servicio
   - El comando de inicio será: `uvicorn main:app --host 0.0.0.0 --port $PORT`

## 3. Despliegue de MySQL en Railway

### Pasos:

1. **Crear base de datos en Railway:**
   - En Railway, crea un nuevo proyecto
   - Selecciona "Database" → "MySQL"
   - Railway te proporcionará la URL de conexión

2. **Obtener la URL de conexión:**
   - Ve a la pestaña "Variables" en Railway
   - Copia la URL de la base de datos
   - Actualiza las variables de entorno de cada microservicio

## 4. Configuración de CORS

Asegúrate de que cada microservicio tenga configurado CORS para permitir solicitudes desde tu dominio de Vercel:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://tu-vercel-url.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## 5. Configuración de Google OAuth

1. **Actualizar Google Cloud Console:**
   - Ve a [Google Cloud Console](https://console.cloud.google.com)
   - APIs & Services → Credentials
   - Actualiza los "Authorized redirect URIs" con:
     ```
     https://tu-vercel-url.vercel.app/auth/google/callback
     ```

## 6. Verificación

1. **Verificar que todos los servicios estén corriendo:**
   - Frontend: https://tu-vercel-url.vercel.app
   - Auth Service: https://tu-auth-service-url.railway.app/health
   - Services Catalog: https://tu-services-catalog-url.railway.app/health
   - Appointments: https://tu-appointments-service-url.railway.app/health
   - Reviews: https://tu-reviews-service-url.railway.app/health
   - Pets: https://tu-pets-service-url.railway.app/health

2. **Probar el flujo completo:**
   - Registro/Login
   - Creación de citas
   - Visualización de servicios
   - Reseñas

## Alternativas a Railway

Si prefieres usar otros servicios:

- **Render:** Similar a Railway, soporta Docker y Python
- **Fly.io:** Soporta Docker y tiene buen soporte para Python
- **Heroku:** Clásico, pero tiene límites en el plan gratuito
- **AWS/GCP/Azure:** Para despliegues enterprise

## Notas Importantes

- Los archivos `.env` no están en el control de versiones por seguridad
- Usa `.env.example` como referencia para las variables de entorno
- Asegúrate de regenerar las credenciales de Google OAuth después de exponerlas
- Configura correctamente los CORS para evitar errores de conexión
