# 🐕 Groomer Panel - Documentación

## 📋 Descripción General

El **Groomer Panel** es un sistema integral diseñado para que trabajadores (Groomers/Paseadores) gestionen sus servicios, mascotas atendidas, historial, estadísticas y perfil profesional de forma moderna, intuitiva y responsiva.

---

## 🏗️ Estructura de Carpetas

```
pages/groomer/
├── GroomerLayout.jsx           # Layout base con navegación
├── GroomerDashboard.jsx        # Dashboard principal
├── components/
│   ├── StatCard.jsx            # Tarjeta de estadísticas
│   ├── ServiceCard.jsx         # Tarjeta de servicio
│   ├── PetCard.jsx             # Tarjeta de mascota
│   └── NotificationCard.jsx    # Tarjeta de notificación
├── services/
│   └── GroomerServices.jsx     # Gestión de servicios
├── pets/
│   └── GroomerPets.jsx         # Mascotas atendidas
├── history/
│   └── GroomerHistory.jsx      # Historial de servicios
├── statistics/
│   └── GroomerStatistics.jsx   # Gráficas y estadísticas
└── profile/
    └── GroomerProfile.jsx      # Perfil del groomer
```

---

## 🎨 Estilos CSS

```
estilos/
├── GroomerLayout.css           # Estilos del layout
├── GroomerDashboard.css        # Estilos del dashboard
├── GroomerServices.css         # Estilos de servicios
├── GroomerPets.css             # Estilos de mascotas
├── GroomerHistory.css          # Estilos del historial
├── GroomerStatistics.css       # Estilos de estadísticas
├── GroomerProfile.css          # Estilos del perfil
└── components/
    ├── StatCard.css            # Estilos de tarjeta estadística
    ├── ServiceCard.css         # Estilos de tarjeta de servicio
    ├── PetCard.css             # Estilos de tarjeta de mascota
    └── NotificationCard.css    # Estilos de tarjeta de notificación
```

---

## 📱 Características Principales

### 1. **Dashboard Principal** 📊
- **Tarjetas de Estadísticas**: Citas hoy, completadas, ganancias, rating, mascotas atendidas, próxima cita
- **Servicios del Día**: Listado de citas con estados y acciones rápidas
- **Notificaciones**: Alertas en tiempo real
- **Mascotas Recientes**: Acceso rápido a mascotas frecuentes
- **Acciones Rápidas**: Botones de acceso a secciones principales

### 2. **Gestión de Servicios** 📋
- Filtrado por estado (Todos, Pendientes, Confirmados, En Progreso, Completados)
- Ordenamiento dinámico
- Cambio de estados (Confirmar → Iniciar → Finalizar)
- Información detallada de mascotas y recomendaciones
- Resumen diario de servicios

### 3. **Mascotas Atendidas** 🐾
- Búsqueda por nombre o dueño
- Filtrado por raza
- Ordenamiento múltiple
- Modal con información completa
- Estadísticas de mascotas

### 4. **Historial** 📜
- Tabla completa de servicios realizados
- Filtrado por período (Hoy, Semana, Mes, Todo)
- Información de ganancias, duraciones y ratings
- Modal con detalles de cada servicio
- Resumen de métricas

### 5. **Estadísticas** 📈
- Selector de período (Semana, Mes, Año)
- Gráficas de servicios por tipo (Barras)
- Gráficas de ganancias (Línea)
- Distribución de clientes
- Calificaciones por estrella (Distribución)
- Insights de desempeño

### 6. **Perfil** 👤
- Edición de información personal
- Gestión de especialidades
- Horarios de disponibilidad configurables
- Reseñas de clientes
- Foto de perfil

---

## 🎯 Estados de Servicios

| Estado | Color | Descripción |
|--------|-------|------------|
| **Pendiente** | Naranja | Servicio asignado, esperando confirmación |
| **Confirmado** | Azul | Groomer ha confirmado, esperando iniciar |
| **En Progreso** | Azul claro | Servicio actualmente en ejecución |
| **Completado** | Verde | Servicio finalizado exitosamente |
| **Cancelado** | Rojo | Servicio cancelado |

---

## 🔄 Flujo de Navegación

```
┌─────────────────────────────────────┐
│    GROOMER LAYOUT (Sidebar + Top)   │
├─────────────────────────────────────┤
│                                      │
│  ┌─────────────────────────────┐   │
│  │   Dashboard (Default)        │   │
│  │ - Stats Cards               │   │
│  │ - Services Today            │   │
│  │ - Notifications             │   │
│  │ - Recent Pets               │   │
│  └─────────────────────────────┘   │
│           ↓↓↓                       │
│  ┌─────────────────────────────┐   │
│  │   Mis Servicios             │   │
│  │ - Full list with filters    │   │
│  │ - State management          │   │
│  │ - Detailed views            │   │
│  └─────────────────────────────┘   │
│           ↓↓↓                       │
│  ┌─────────────────────────────┐   │
│  │   Mascotas Atendidas        │   │
│  │ - Search & filter           │   │
│  │ - Pet cards                 │   │
│  │ - History modal             │   │
│  └─────────────────────────────┘   │
│           ↓↓↓                       │
│  ┌─────────────────────────────┐   │
│  │   Historial                 │   │
│  │ - Full data table           │   │
│  │ - Period filters            │   │
│  │ - Detail modals             │   │
│  └─────────────────────────────┘   │
│           ↓↓↓                       │
│  ┌─────────────────────────────┐   │
│  │   Estadísticas              │   │
│  │ - Multiple charts           │   │
│  │ - Period selector           │   │
│  │ - Performance insights      │   │
│  └─────────────────────────────┘   │
│           ↓↓↓                       │
│  ┌─────────────────────────────┐   │
│  │   Mi Perfil                 │   │
│  │ - Edit mode                 │   │
│  │ - Availability schedule     │   │
│  │ - Reviews display           │   │
│  └─────────────────────────────┘   │
│                                      │
└─────────────────────────────────────┘
```

---

## 🎨 Temas (Dark/Light Mode)

Todos los componentes soportan **Dark Mode** automáticamente usando:
- Variables CSS personalizadas
- Media queries `@media (prefers-color-scheme: dark)`
- Colores adaptables

**Variables CSS Principales:**
```css
--primary-color: #3b82f6
--secondary-color: #6366f1
--success-color: #10b981
--warning-color: #f59e0b
--danger-color: #dc2626
--text-primary: #1a1a1a
--text-secondary: #666
--bg-primary: #f8f9fa
--card-bg: #ffffff
--border-color: #e5e7eb
```

---

## 📱 Responsividad

El panel está completamente optimizado para:
- **Desktop** (1920px+)
- **Tablet** (768px - 1024px)
- **Mobile** (320px - 767px)

**Breakpoints:**
```css
@media (max-width: 1024px) { /* Tablets */ }
@media (max-width: 768px)  { /* Mobile tablets */ }
@media (max-width: 480px)  { /* Small phones */ }
```

---

## 🔧 Cómo Usar

### Importar en App.js

```jsx
import GroomerLayout from './pages/groomer/GroomerLayout';
import GroomerDashboard from './pages/groomer/GroomerDashboard';
import GroomerServices from './pages/groomer/services/GroomerServices';
import GroomerPets from './pages/groomer/pets/GroomerPets';
import GroomerHistory from './pages/groomer/history/GroomerHistory';
import GroomerStatistics from './pages/groomer/statistics/GroomerStatistics';
import GroomerProfile from './pages/groomer/profile/GroomerProfile';

// En tu router:
<Route path="/groomer/dashboard" element={<GroomerLayout><GroomerDashboard /></GroomerLayout>} />
<Route path="/groomer/services" element={<GroomerLayout><GroomerServices /></GroomerLayout>} />
<Route path="/groomer/pets" element={<GroomerLayout><GroomerPets /></GroomerLayout>} />
<Route path="/groomer/history" element={<GroomerLayout><GroomerHistory /></GroomerLayout>} />
<Route path="/groomer/statistics" element={<GroomerLayout><GroomerStatistics /></GroomerLayout>} />
<Route path="/groomer/profile" element={<GroomerLayout><GroomerProfile /></GroomerLayout>} />
```

---

## 📊 Componentes Reutilizables

### StatCard
```jsx
<StatCard
  icon="📊"
  label="Citas Hoy"
  value={5}
  color="primary"
  trend={{ type: 'up', percent: 12 }}
/>
```

### ServiceCard
```jsx
<ServiceCard
  service={serviceObject}
  onStatusChange={(id, newStatus) => handleStatusChange(id, newStatus)}
/>
```

### PetCard
```jsx
<PetCard
  pet={petObject}
  onViewHistory={(petId) => handleViewHistory(petId)}
/>
```

### NotificationCard
```jsx
<NotificationCard
  notification={notificationObject}
  onDismiss={(notifId) => handleDismiss(notifId)}
/>
```

---

## 🎯 Próximas Mejoras

- [ ] Integración con API real
- [ ] Sistema de autenticación
- [ ] Push notifications en tiempo real
- [ ] Chat con clientes
- [ ] Mapas de ubicación
- [ ] Exportar reportes PDF
- [ ] Integración con pagos
- [ ] Fotos de trabajos realizados
- [ ] Seguimiento GPS en vivo
- [ ] Sincronización offline

---

## 📝 Notas

- Todos los datos son **mock data** para demostración
- Los estilos utilizan **CSS moderno** con variables personalizadas
- Compatible con **React Router v6**
- Requiere **React 16.8+** (Hooks)
- Todos los componentes son **funcionales** (no clase)

---

## 👨‍💻 Autor

Documentación del Groomer Panel v1.0
Diseñado para la aplicación Paseos Felices

---

## 📄 Licencia

Todos los derechos reservados © 2024
