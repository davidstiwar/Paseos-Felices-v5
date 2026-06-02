# Guía Paso a Paso - Despliegue en Vercel

## Paso 1: Crear cuenta en Vercel

1. Ve a [vercel.com](https://vercel.com)
2. Haz clic en "Sign Up"
3. Regístrate con tu cuenta de GitHub (recomendado)
4. Autoriza Vercel para acceder a tus repositorios de GitHub

## Paso 2: Importar el repositorio

1. En el dashboard de Vercel, haz clic en "Add New Project"
2. Verás la lista de tus repositorios de GitHub
3. Busca y selecciona: `Paseos-Felices-v5`
4. Haz clic en "Import"

## Paso 3: Configurar el proyecto

### Configuración del Framework

Vercel detectará automáticamente que es un proyecto React. Verás:

- **Framework Preset:** Create React App
- **Root Directory:** `frontend` (cámbialo de `.` a `frontend`)
- **Build Command:** `npm run build` (automático)
- **Output Directory:** `build` (automático)

### Configuración del Directorio Raíz

1. En el campo "Root Directory", cambia `.` por `frontend`
2. Esto le dice a Vercel que el código del frontend está en la carpeta `frontend`

## Paso 4: Configurar Variables de Entorno

1. Desplázate hacia abajo hasta la sección "Environment Variables"
2. Agrega las siguientes variables:

```
REACT_APP_AUTH_SERVICE_URL=https://tu-auth-service-url.railway.app
REACT_APP_SERVICES_CATALOG_URL=https://tu-services-catalog-url.railway.app
REACT_APP_APPOINTMENTS_SERVICE_URL=https://tu-appointments-service-url.railway.app
REACT_APP_REVIEWS_SERVICE_URL=https://tu-reviews-service-url.railway.app
REACT_APP_PETS_SERVICE_URL=https://tu-pets-service-url.railway.app
```

**Nota:** Por ahora, puedes usar URLs temporales o localhost. Las actualizarás después de desplegar los microservicios.

## Paso 5: Desplegar

1. Haz clic en el botón "Deploy"
2. Vercel comenzará a construir tu proyecto
3. Espera a que termine el proceso (puede tomar 2-3 minutos)
4. Verás un check verde cuando esté listo

## Paso 6: Obtener la URL de Vercel

1. Después del despliegue exitoso, Vercel te mostrará la URL
2. Será algo como: `https://paseos-felices-v5-xxxxx.vercel.app`
3. Copia esta URL, la necesitarás para configurar los microservicios

## Paso 7: Configurar Dominio Personalizado (Opcional)

1. Ve a la pestaña "Domains" en tu proyecto de Vercel
2. Haz clic en "Add Domain"
3. Ingresa tu dominio personal (si tienes uno)
4. Sigue las instrucciones para configurar los DNS

## Paso 8: Verificar el Despliegue

1. Abre la URL de Vercel en tu navegador
2. Verifica que la página cargue correctamente
3. Revisa la consola del navegador (F12) para ver si hay errores

## Paso 9: Actualizar Variables de Entorno (Después de desplegar microservicios)

Una vez que despliegues los microservicios en Railway:

1. Ve a tu proyecto en Vercel
2. Haz clic en "Settings" → "Environment Variables"
3. Actualiza las URLs con las URLs reales de Railway:
   ```
   REACT_APP_AUTH_SERVICE_URL=https://tu-auth-service-url.railway.app
   REACT_APP_SERVICES_CATALOG_URL=https://tu-services-catalog-url.railway.app
   REACT_APP_APPOINTMENTS_SERVICE_URL=https://tu-appointments-service-url.railway.app
   REACT_APP_REVIEWS_SERVICE_URL=https://tu-reviews-service-url.railway.app
   REACT_APP_PETS_SERVICE_URL=https://tu-pets-service-url.railway.app
   ```
4. Haz clic en "Save"
5. Vercel hará un redeploy automático

## Paso 10: Configurar Google OAuth

1. Ve a [Google Cloud Console](https://console.cloud.google.com)
2. APIs & Services → Credentials
3. Edita tu cliente OAuth 2.0
4. En "Authorized redirect URIs", agrega:
   ```
   https://tu-vercel-url.vercel.app/auth/google/callback
   ```
5. Guarda los cambios

## Troubleshooting

### Error: "Build failed"

- Verifica que el directorio raíz sea `frontend`
- Asegúrate de que `package.json` esté en la carpeta `frontend`
- Revisa los logs de construcción en Vercel

### Error: "Cannot find module"

- Verifica que `node_modules` no esté en el .gitignore
- Vercel instalará las dependencias automáticamente

### Error: "Connection refused"

- Verifica que los microservicios estén corriendo
- Actualiza las URLs de las variables de entorno
- Verifica la configuración de CORS en los microservicios

## Comandos Útiles

### Ver logs de despliegue
- Ve a la pestaña "Deployments" en Vercel
- Haz clic en el deployment específico
- Revisa los logs para ver errores

### Redeploy manual
- Ve a la pestaña "Deployments"
- Haz clic en los tres puntos (•••) al lado del deployment
- Selecciona "Redeploy"

### Ver variables de entorno
- Ve a "Settings" → "Environment Variables"
- Aquí puedes agregar, editar o eliminar variables

## Próximos Pasos

Después de desplegar el frontend en Vercel:

1. Despliega los microservicios en Railway (sigue DEPLOYMENT.md)
2. Actualiza las variables de entorno en Vercel con las URLs de Railway
3. Configura Google OAuth con la URL de Vercel
4. Prueba el flujo completo de la aplicación
