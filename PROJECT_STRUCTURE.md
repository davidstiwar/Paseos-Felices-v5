# Estructura del Proyecto Paseos Felices v5

## Resumen General

```
Paseos-felices-v5-main/
├── frontend/                    # Aplicación React (Frontend)
├── servicios/                   # Microservicios FastAPI (Backend)
├── database/                   # Scripts de base de datos
├── docs/                       # Documentación
├── .env.example               # Variables de entorno de ejemplo
├── .gitignore                 # Archivos ignorados por Git
├── requirements.txt            # Dependencias Python globales
└── start-app.ps1             # Script para iniciar todos los servicios
```

---

## Frontend (React)

```
frontend/
├── public/                     # Archivos estáticos
│   ├── index.html             # HTML principal
│   ├── favicon.ico           # Icono del sitio
│   ├── logo192.png           # Logo 192x192
│   ├── logo512.png           # Logo 512x512
│   ├── manifest.json         # Manifiesto PWA
│   └── robots.txt            # Configuración de robots
├── src/                       # Código fuente React
│   ├── App.js               # Componente principal
│   ├── App.test.js          # Tests de App.js
│   ├── index.js             # Punto de entrada
│   ├── index.css            # Estilos globales
│   ├── reportWebVitals.js   # Métricas de rendimiento
│   ├── setupTests.js        # Configuración de tests
│   ├── api/                 # Clientes API
│   │   ├── auth.js         # API de autenticación
│   │   ├── appointments.js # API de citas
│   │   ├── pets.js         # API de mascotas
│   │   ├── servicesCatalog.js # API de catálogo
│   │   ├── groomer.js      # API de groomers
│   │   ├── reviews.js      # API de reseñas
│   │   └── userProfile.js # API de perfil de usuario
│   ├── components/          # Componentes React
│   │   ├── Auth/           # Componentes de autenticación
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── OAuthButtons.jsx
│   │   │   └── ForgotPassword.jsx
│   │   ├── Common/         # Componentes comunes
│   │   │   ├── ModalDialog.jsx
│   │   │   ├── LoadingSpinner.jsx
│   │   │   └── ErrorBoundary.jsx
│   │   ├── Context/        # Contextos React
│   │   │   └── ToastContext.jsx
│   │   ├── Layout/         # Componentes de layout
│   │   │   ├── Navbar.jsx
│   │   │   ├── Footer.jsx
│   │   │   └── Sidebar.jsx
│   │   └── ...             # Otros componentes
│   ├── pages/               # Páginas de la aplicación
│   │   ├── admin/          # Páginas de administrador
│   │   │   ├── appointments/
│   │   │   │   └── AdminAppointmentsPage.jsx
│   │   │   ├── users/
│   │   │   ├── services/
│   │   │   └── ...
│   │   ├── client/         # Páginas de cliente
│   │   │   ├── appointments/
│   │   │   ├── pets/
│   │   │   └── ...
│   │   ├── groomer/        # Páginas de groomer
│   │   │   ├── appointments/
│   │   │   ├── profile/
│   │   │   └── ...
│   │   └── auth/          # Páginas de autenticación
│   │       ├── LoginPage.jsx
│   │       ├── RegisterPage.jsx
│   │       └── ...
│   ├── data/               # Datos estáticos
│   ├── estilos/            # Estilos CSS
│   └── utils/              # Utilidades
│       └── helpers.js
├── .env                     # Variables de entorno locales
├── .env.example            # Variables de entorno de ejemplo
├── .gitignore              # Archivos ignorados por Git
├── package.json            # Dependencias NPM
├── package-lock.json       # Lock de dependencias
├── README.md              # Documentación del frontend
└── vercel.json            # Configuración de Vercel
```

---

## Servicios (Backend - FastAPI Microservicios)

```
servicios/
├── common/                  # Código compartido entre servicios
│   ├── config/             # Configuración base
│   │   ├── base.py        # Clase base de configuración
│   │   └── __init__.py
│   ├── database.py         # Configuración de base de datos
│   ├── observability/      # Métricas y monitoreo
│   │   ├── metrics.py     # Métricas Prometheus
│   │   └── __init__.py
│   ├── security/          # Seguridad
│   │   ├── jwt.py        # Utilidades JWT
│   │   └── __init__.py
│   ├── Start-Microservice.ps1 # Script genérico de inicio
│   └── __init__.py
├── auth-service/           # Servicio de autenticación (Puerto 8000)
│   ├── auth/              # Lógica de autenticación
│   │   ├── router.py      # Endpoints de autenticación
│   │   ├── models.py      # Modelos de base de datos
│   │   ├── schemas.py     # Esquemas Pydantic
│   │   └── database.py    # Configuración de DB
│   ├── core/              # Configuración del servicio
│   │   ├── config.py      # Variables de entorno
│   │   └── __init__.py
│   ├── main.py            # Punto de entrada FastAPI
│   ├── requirements.txt   # Dependencias Python
│   ├── .env              # Variables de entorno locales
│   ├── .env.example      # Variables de entorno de ejemplo
│   └── start.ps1         # Script de inicio
├── services-catalog-service/ # Catálogo de servicios (Puerto 3014)
│   ├── catalog/          # Lógica de catálogo
│   │   ├── router.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   └── database.py
│   ├── core/
│   │   └── config.py
│   ├── main.py
│   ├── requirements.txt
│   ├── .env
│   └── start.ps1
├── appointments-service/    # Gestión de citas (Puerto 3023)
│   ├── appointments/      # Lógica de citas
│   │   ├── router.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   └── database.py
│   ├── invoices/          # Lógica de facturación
│   │   ├── router.py
│   │   ├── models.py
│   │   └── schemas.py
│   ├── core/
│   │   └── config.py
│   ├── main.py
│   ├── requirements.txt
│   ├── .env
│   └── start.ps1
├── reviews-service/        # Reseñas y calificaciones (Puerto 3007)
│   ├── reviews/
│   │   ├── router.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   └── database.py
│   ├── core/
│   │   └── config.py
│   ├── main.py
│   ├── requirements.txt
│   ├── .env
│   └── start.ps1
├── pets-service/           # Gestión de mascotas (Puerto 3022)
│   ├── pets/
│   │   ├── router.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   └── database.py
│   ├── core/
│   │   └── config.py
│   ├── main.py
│   ├── requirements.txt
│   ├── .env
│   └── start.ps1
├── groomer-service/        # Servicio de groomers
│   ├── groomer/
│   │   ├── router.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   └── database.py
│   ├── core/
│   │   └── config.py
│   ├── main.py
│   ├── requirements.txt
│   ├── .env
│   └── start.ps1
├── notifications-service/ # Servicio de notificaciones
│   ├── notifications/
│   │   ├── router.py
│   │   ├── models.py
│   │   └── schemas.py
│   ├── core/
│   │   └── config.py
│   ├── main.py
│   ├── requirements.txt
│   ├── .env
│   └── start.ps1
├── user-profile-service/  # Perfil de usuario
│   ├── profile/
│   │   ├── router.py
│   │   ├── models.py
│   │   └── schemas.py
│   ├── core/
│   │   └── config.py
│   ├── main.py
│   ├── requirements.txt
│   ├── .env
│   └── start.ps1
├── storage-service/       # Almacenamiento de archivos
│   ├── storage/
│   │   ├── router.py
│   │   └── schemas.py
│   ├── core/
│   │   └── config.py
│   ├── main.py
│   ├── requirements.txt
│   ├── .env
│   └── start.ps1
├── email-service/         # Servicio de email
│   ├── email/
│   │   ├── router.py
│   │   └── schemas.py
│   ├── core/
│   │   └── config.py
│   ├── main.py
│   ├── requirements.txt
│   ├── .env
│   └── start.ps1
├── search-service/        # Servicio de búsqueda
│   ├── search/
│   │   ├── router.py
│   │   └── schemas.py
│   ├── core/
│   │   └── config.py
│   ├── main.py
│   ├── requirements.txt
│   └── start.ps1
├── reporting-service/     # Servicio de reportes
│   ├── reporting/
│   │   ├── router.py
│   │   └── schemas.py
│   ├── core/
│   │   └── config.py
│   ├── main.py
│   ├── requirements.txt
│   └── start.ps1
├── observability/         # Configuración de observabilidad
│   └── metrics.py
├── migrations/            # Migraciones de base de datos
└── mysql-setup.sql        # Script de configuración MySQL
```

---

## Archivos de Configuración Raíz

```
Paseos-felices-v5-main/
├── .env.example           # Variables de entorno de ejemplo
│   # Contiene ejemplos para:
│   # - DATABASE_URL (MySQL)
│   # - GOOGLE_CLIENT_ID
│   # - GOOGLE_CLIENT_SECRET
│   # - FRONTEND_URL
│   # - BACKEND_CORS_ORIGINS
│   # - SECRET_KEY
│   # - SMTP settings
├── .gitignore             # Archivos ignorados por Git
│   # Ignora:
│   # - .env
│   # - __pycache__
│   # - node_modules
│   # - .venv
│   # - logs
├── requirements.txt       # Dependencias Python globales
│   # Contiene dependencias comunes
│   # para desarrollo local
└── start-app.ps1         # Script PowerShell para iniciar todos los servicios
    # Inicia:
    # - Auth Service (puerto 8000)
    # - Services Catalog (puerto 3014)
    # - Appointments (puerto 3023)
    # - Reviews (puerto 3007)
    # - Pets Service (puerto 3022)
    # - Frontend React (puerto 3000)
```

---

## Base de Datos

```
database/
└── (scripts de configuración)
```

**Bases de datos MySQL:**
- `paseos_auth` - Usuarios y autenticación
- `paseos_pets` - Mascotas de clientes
- `paseos_groomer` - Información de groomers
- `paseos_appointments` - Citas y facturación
- `paseos_services_catalog` - Catálogo de servicios
- `paseos_availability` - Disponibilidad de groomers
- `paseos_reviews` - Reseñas y calificaciones
- `paseos_notifications` - Notificaciones
- `paseos_user_profile` - Perfiles de usuario
- `paseos_reporting` - Reportes y analíticas

---

## Documentación

```
docs/
└── (documentación del proyecto)
```

---

## Arquitectura

### Frontend (React)
- **Framework:** React con Create React App
- **Routing:** React Router
- **Estado:** Context API + useState/useEffect
- **Estilos:** CSS Modules + CSS global
- **API:** Fetch API con endpoints REST
- **Autenticación:** JWT tokens almacenados en localStorage
- **Despliegue:** Vercel

### Backend (FastAPI Microservicios)
- **Framework:** FastAPI
- **Base de datos:** MySQL con SQLAlchemy ORM
- **Autenticación:** JWT tokens
- **CORS:** Configurado para permitir orígenes específicos
- **Métricas:** Prometheus (opcional)
- **Despliegue:** Railway, Render, o Fly.io

### Comunicación entre Servicios
- Los servicios se comunican a través de HTTP REST
- Cada servicio tiene su propia base de datos MySQL
- El frontend se comunica directamente con cada microservicio
- No hay comunicación directa entre microservicios (arquitectura de servicios independientes)

---

## Puertos de los Servicios

| Servicio | Puerto Local |
|----------|-------------|
| Frontend React | 3000 |
| Auth Service | 8000 |
| Services Catalog | 3014 |
| Appointments | 3023 |
| Reviews | 3007 |
| Pets Service | 3022 |
| Groomer Service | (definido en config) |
| Notifications | (definido en config) |
| User Profile | (definido en config) |
| Storage | (definido en config) |
| Email | (definido en config) |
| Search | (definido en config) |
| Reporting | (definido en config) |

---

## Variables de Entorno Principales

### Frontend (.env)
```
REACT_APP_AUTH_SERVICE_URL=http://localhost:8000
REACT_APP_SERVICES_CATALOG_URL=http://localhost:3014
REACT_APP_APPOINTMENTS_SERVICE_URL=http://localhost:3023
REACT_APP_REVIEWS_SERVICE_URL=http://localhost:3007
REACT_APP_PETS_SERVICE_URL=http://localhost:3022
```

### Backend (cada servicio tiene su propio .env)
```
DATABASE_URL=mysql+pymysql://root:@localhost:3306/nombre_db
GOOGLE_CLIENT_ID=tu_client_id
GOOGLE_CLIENT_SECRET=tu_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback
FRONTEND_URL=http://localhost:3000
BACKEND_CORS_ORIGINS=["http://localhost:3000"]
SECRET_KEY=tu_secreto
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
```

---

## Flujo de Datos

1. **Usuario** → Frontend React (Vercel)
2. **Frontend** → API calls a microservicios (Railway)
3. **Microservicios** → Base de datos MySQL (Railway)
4. **Respuesta** → Frontend → Usuario

---

## Notas Importantes

- Cada microservicio es independiente y puede ser desplegado por separado
- El código compartido está en `servicios/common/`
- Los servicios usan SQLAlchemy ORM para interactuar con MySQL
- El frontend usa JWT tokens para autenticación
- Google OAuth está configurado para autenticación social
- El proyecto está diseñado para ser escalable mediante microservicios
