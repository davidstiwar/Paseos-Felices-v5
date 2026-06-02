# 👥 Client Panel - Documentación

## 📋 Descripción General

El **Client Panel** es la interfaz diseñada para que los clientes de Paseos Felices gestionen sus mascotas, citas, visualicen estadísticas y mantengan su perfil actualizado.

---

## 🏗️ Estructura de Carpetas

```
pages/client/
├── ClientLayout.jsx              # Layout base con navegación
├── dashboard/
│   └── ClientDashboard.jsx      # Dashboard principal con estadísticas
├── profile/
│   └── ClientProfile.jsx        # Perfil del cliente con edición
├── pets/
│   └── MyPets.jsx               # Gestión de mascotas
├── appointments/
│   └── MyAppointments.jsx       # Citas programadas
├── history/
│   └── ServiceHistory.jsx       # Historial de servicios
├── components/
│   ├── PetCard.jsx              # Tarjeta de mascota
│   ├── AppointmentCard.jsx      # Tarjeta de cita
│   ├── StatCard.jsx             # Tarjeta de estadística
│   └── ServiceCard.jsx          # Tarjeta de servicio
└── README.md                    # Esta documentación
```

---

## 📱 Secciones del Panel

### 1. **Dashboard Principal** 📊
- **Ubicación:** `/client`
- **Archivo:** `dashboard/ClientDashboard.jsx`
- **Contenido:**
  - Bienvenida personalizada
  - Tarjetas de estadísticas
  - Gráficas (barras y pie)
  - Próxima cita
  - Notificaciones
  - Vista previa de mascotas
  - Historial reciente

### 2. **Perfil del Cliente** 👤
- **Ubicación:** `/client/profile`
- **Archivo:** `profile/ClientProfile.jsx`
- **Funcionalidades:**
  - Edición de datos personales
  - Cambio de contraseña
  - Validación de formularios
  - Confirmación de cambios

### 3. **Mis Mascotas** 🐾
- **Ubicación:** `/client/pets`
- **Archivo:** `pets/MyPets.jsx`
- **Funcionalidades:**
  - Listado de mascotas
  - Agregar nueva mascota
  - Editar información
  - Ver historial por mascota
  - Fotos y detalles

### 4. **Mis Citas** 📅
- **Ubicación:** `/client/appointments`
- **Archivo:** `appointments/MyAppointments.jsx`
- **Funcionalidades:**
  - Citas programadas
  - Cancelar citas
  - Reprogramar citas
  - Estado de cita
  - Información del groomer

### 5. **Historial de Servicios** 📜
- **Ubicación:** `/client/history`
- **Archivo:** `history/ServiceHistory.jsx`
- **Funcionalidades:**
  - Listado histórico de servicios
  - Filtrado por rango de fechas
  - Calificaciones realizadas
  - Detalles de cada servicio
  - Recibos/facturas

---

## 🔄 Estructura de Navegación

```
ClientLayout (Contenedor principal)
│
├── Sidebar (Navegación lateral)
│   ├── Dashboard
│   ├── Perfil
│   ├── Mascotas
│   └── Citas
│
└── Main Content
    ├── /client → ClientDashboard
    ├── /client/profile → ClientProfile
    ├── /client/pets → MyPets
    ├── /client/appointments → MyAppointments
    └── /client/history → ServiceHistory
```

---

## 🧩 Componentes Reutilizables

### StatCard
Tarjeta de estadística con icono y valor

```jsx
<StatCard
  icon="📊"
  label="Total Citas"
  value={15}
  color="primary"
/>
```

### PetCard
Tarjeta de mascota con información

```jsx
<PetCard
  pet={{
    id: 1,
    name: "Luna",
    breed: "Golden Retriever",
    image: "url"
  }}
/>
```

### AppointmentCard
Tarjeta de cita

```jsx
<AppointmentCard
  appointment={{
    id: 1,
    petName: "Luna",
    service: "Baño y Corte",
    date: "2024-05-22",
    time: "10:30 AM",
    groomerName: "John"
  }}
/>
```

### ServiceCard
Tarjeta de servicio realizado

```jsx
<ServiceCard
  service={{
    id: 1,
    petName: "Luna",
    service: "Baño",
    date: "2024-05-21",
    rating: 5,
    groomerName: "John"
  }}
/>
```

---

## 🎨 Temas y Estilos

- **Dark Mode/Light Mode:** Soporte automático
- **Variables CSS:** Personalizables
- **Responsive:** Desktop, Tablet, Mobile
- **Estilos:** En `estilos/ClientPanel.css` y `estilos/ClientProfile.css`

---

## 📱 Responsividad

| Tamaño | Breakpoint | Descripción |
|--------|-----------|------------|
| Desktop | 1024px+ | Pantalla completa |
| Tablet | 768px - 1024px | Sidebar colapsable |
| Mobile | < 768px | Sidebar en menú |

---

## 🔌 Integración en App.js

```jsx
import ClientLayout from './pages/client/ClientLayout';
import ClientDashboard from './pages/client/dashboard/ClientDashboard';
import ClientProfile from './pages/client/profile/ClientProfile';
import MyPets from './pages/client/pets/MyPets';
import MyAppointments from './pages/client/appointments/MyAppointments';
import ServiceHistory from './pages/client/history/ServiceHistory';

// Rutas:
<Route path="/client" element={<ClientLayout><ClientDashboard /></ClientLayout>} />
<Route path="/client/profile" element={<ClientLayout><ClientProfile /></ClientLayout>} />
<Route path="/client/pets" element={<ClientLayout><MyPets /></ClientLayout>} />
<Route path="/client/appointments" element={<ClientLayout><MyAppointments /></ClientLayout>} />
<Route path="/client/history" element={<ClientLayout><ServiceHistory /></ClientLayout>} />
```

---

## 🔐 Seguridad

- Campos de email deshabilitados
- Validación de contraseñas
- Confirmación de cambios
- Mensajes de éxito/error

---

## 📊 Datos Mock

Todos los componentes incluyen **mock data** para pruebas:
- Dashboard: Estadísticas, gráficas, notificaciones
- Perfil: Datos de usuario
- Mascotas: Listado de ejemplo
- Citas: Citas próximas
- Historial: Servicios realizados

---

## 🚀 Próximas Mejoras

- [ ] Integración con APIs reales
- [ ] Sistema de autenticación completo
- [ ] Notificaciones en tiempo real
- [ ] Chat con groomer
- [ ] Seguimiento GPS
- [ ] Galería de fotos
- [ ] Sistema de calificaciones
- [ ] Pagos online
- [ ] Reportes descargables

---

## 📝 Notas

- Todos los imports usan rutas relativas correctas
- Componentes son **funcionales** (React Hooks)
- Compatible con **React Router v6**
- Requiere **React 16.8+**

---

## 👨‍💻 Autor

Documentación del Client Panel v1.0
Diseñado para la aplicación Paseos Felices

---

## 📄 Licencia

Todos los derechos reservados © 2024
