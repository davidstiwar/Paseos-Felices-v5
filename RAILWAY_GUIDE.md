# Guía Paso a Paso - Despliegue de Microservicios en Railway

## Paso 1: Crear cuenta en Railway

1. Ve a [railway.app](https://railway.app)
2. Haz clic en "Login"
3. Regístrate con tu cuenta de GitHub
4. Autoriza Railway para acceder a tus repositorios

## Paso 2: Crear proyecto de base de datos MySQL

1. En el dashboard de Railway, haz clic en "New Project"
2. Selecciona "Deploy from GitHub repo"
3. O selecciona "Provision MySQL" directamente
4. Railway creará una base de datos MySQL automáticamente
5. Copia la URL de conexión de la base de datos (la necesitarás más tarde)

**La URL de conexión tendrá este formato:**
```
mysql://root:password@host:port/railway
```

**Conviértela al formato SQLAlchemy:**
```
mysql+pymysql://root:password@host:port/railway
```

## Paso 3: Desplegar Auth Service

### 3.1 Crear proyecto para Auth Service

1. Haz clic en "New Project" → "Deploy from GitHub repo"
2. Selecciona tu repositorio: `Paseos-Felices-v5`
3. En "Root Directory", escribe: `servicios/auth-service`
4. Haz clic en "Deploy"

### 3.2 Configurar variables de entorno

1. Ve a la pestaña "Variables" en tu proyecto de Railway
2. Agrega las siguientes variables:

```
DATABASE_URL=mysql+pymysql://root:password@host:port/railway
GOOGLE_CLIENT_ID=tu_google_client_id
GOOGLE_CLIENT_SECRET=tu_google_client_secret
GOOGLE_REDIRECT_URI=https://tu-vercel-url.vercel.app/auth/google/callback
FRONTEND_URL=https://tu-vercel-url.vercel.app
PORT=8000
```

**Nota:** Reemplaza `tu-vercel-url.vercel.app` con la URL real de tu proyecto en Vercel.

### 3.3 Configurar el comando de inicio

1. Ve a la pestaña "Settings"
2. En "Build & Deployment Settings", configura:
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`

### 3.4 Obtener la URL del servicio

1. Una vez desplegado, Railway te mostrará la URL
2. Será algo como: `https://tu-auth-service-production.up.railway.app`
3. Copia esta URL

## Paso 4: Desplegar Services Catalog Service

Repite el proceso para cada servicio:

### 4.1 Crear proyecto

1. "New Project" → "Deploy from GitHub repo"
2. Selecciona: `Paseos-Felices-v5`
3. Root Directory: `servicios/services-catalog-service`
4. Deploy

### 4.2 Configurar variables de entorno

```
DATABASE_URL=mysql+pymysql://root:password@host:port/railway
PORT=3014
```

### 4.3 Configurar comando de inicio

- **Build Command:** `pip install -r requirements.txt`
- **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`

### 4.4 Copiar la URL del servicio

## Paso 5: Desplegar Appointments Service

### 5.1 Crear proyecto

1. "New Project" → "Deploy from GitHub repo"
2. Selecciona: `Paseos-Felices-v5`
3. Root Directory: `servicios/appointments-service`
4. Deploy

### 5.2 Configurar variables de entorno

```
DATABASE_URL=mysql+pymysql://root:password@host:port/railway
PORT=3023
```

### 5.3 Configurar comando de inicio

- **Build Command:** `pip install -r requirements.txt`
- **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`

### 5.4 Copiar la URL del servicio

## Paso 6: Desplegar Reviews Service

### 6.1 Crear proyecto

1. "New Project" → "Deploy from GitHub repo"
2. Selecciona: `Paseos-Felices-v5`
3. Root Directory: `servicios/reviews-service`
4. Deploy

### 6.2 Configurar variables de entorno

```
DATABASE_URL=mysql+pymysql://root:password@host:port/railway
PORT=3007
```

### 6.3 Configurar comando de inicio

- **Build Command:** `pip install -r requirements.txt`
- **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`

### 6.4 Copiar la URL del servicio

## Paso 7: Desplegar Pets Service

### 7.1 Crear proyecto

1. "New Project" → "Deploy from GitHub repo"
2. Selecciona: `Paseos-Felices-v5`
3. Root Directory: `servicios/pets-service`
4. Deploy

### 7.2 Configurar variables de entorno

```
DATABASE_URL=mysql+pymysql://root:password@host:port/railway
PORT=3022
```

### 7.3 Configurar comando de inicio

- **Build Command:** `pip install -r requirements.txt`
- **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`

### 7.4 Copiar la URL del servicio

## Paso 8: Configurar CORS en los servicios

Para que el frontend pueda comunicarse con los servicios, necesitas configurar CORS en cada servicio.

Ve a cada servicio y agrega esta variable de entorno:

```
CORS_ORIGINS=https://tu-vercel-url.vercel.app
```

Luego, en el código de cada servicio, asegúrate de que CORS esté configurado correctamente en `main.py`:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("CORS_ORIGINS", "http://localhost:3000")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Paso 9: Actualizar variables de entorno en Vercel

1. Ve a tu proyecto en Vercel
2. Settings → Environment Variables
3. Actualiza las URLs con las URLs reales de Railway:

```
REACT_APP_AUTH_SERVICE_URL=https://tu-auth-service-production.up.railway.app
REACT_APP_SERVICES_CATALOG_URL=https://tu-services-catalog-production.up.railway.app
REACT_APP_APPOINTMENTS_SERVICE_URL=https://tu-appointments-production.up.railway.app
REACT_APP_REVIEWS_SERVICE_URL=https://tu-reviews-production.up.railway.app
REACT_APP_PETS_SERVICE_URL=https://tu-pets-production.up.railway.app
```

4. Guarda los cambios (Vercel hará redeploy automáticamente)

## Paso 10: Configurar Google OAuth

1. Ve a [Google Cloud Console](https://console.cloud.google.com)
2. APIs & Services → Credentials
3. Edita tu cliente OAuth 2.0
4. En "Authorized redirect URIs", agrega:
   ```
   https://tu-vercel-url.vercel.app/auth/google/callback
   ```
5. Guarda los cambios

## Paso 11: Verificar el despliegue

### Verificar cada servicio:

1. **Auth Service:** `https://tu-auth-service-production.up.railway.app/health`
2. **Services Catalog:** `https://tu-services-catalog-production.up.railway.app/health`
3. **Appointments:** `https://tu-appointments-production.up.railway.app/health`
4. **Reviews:** `https://tu-reviews-production.up.railway.app/health`
5. **Pets:** `https://tu-pets-production.up.railway.app/health`

Cada endpoint debería devolver `{"status": "ok"}` o similar.

### Verificar el frontend:

1. Abre tu URL de Vercel
2. Intenta registrarte/iniciar sesión
3. Verifica que puedas ver los servicios
4. Intenta crear una cita

## Troubleshooting

### Error: "Connection refused"

- Verifica que todos los servicios estén corriendo
- Verifica que las URLs en Vercel sean correctas
- Verifica la configuración de CORS

### Error: "Database connection failed"

- Verifica que la URL de la base de datos sea correcta
- Verifica que la base de datos esté corriendo en Railway
- Verifica que las credenciales sean correctas

### Error: "Build failed"

- Verifica que `requirements.txt` exista en cada servicio
- Verifica que el comando de inicio sea correcto
- Revisa los logs de construcción en Railway

### Error: "Service not responding"

- Verifica que el puerto sea correcto
- Verifica que el servicio esté escuchando en `0.0.0.0`
- Revisa los logs del servicio en Railway

## Notas Importantes

- Railway te da $5 USD de crédito gratis al registrarte
- Después de los $5 gratis, el servicio es de pago
- Los servicios se "duermen" si no se usan (se reactivan automáticamente)
- Puedes monitorear el uso de recursos en el dashboard de Railway
- Considera usar Render.com + PlanetScale como alternativa gratuita permanente

## Costos Estimados (Railway)

- **Plan gratuito:** $5 USD de crédito (aprox. 1-2 meses de uso ligero)
- **Plan pago:** $5 USD/mes por servicio (después del crédito)
- **Base de datos:** Incluida en el plan

Para un proyecto con 5 servicios + base de datos, el costo mensual sería aproximadamente $30 USD/mes después del crédito gratuito.
