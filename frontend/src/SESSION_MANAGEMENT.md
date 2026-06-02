# 🔐 Sistema Centralizado de Sesión - Documentación

## Descripción General

Se ha implementado un sistema centralizado de sesión usando React Context API. Esto asegura que:

✅ La sesión se mantiene activa en toda la aplicación  
✅ Los datos del usuario están siempre sincronizados  
✅ El logout limpia completamente todos los datos  
✅ El token se persiste en localStorage automáticamente  

## Arquitectura

### UserContext (`src/components/UserContext.jsx`)

**Responsabilidades:**
- Centralizar el estado de autenticación
- Cargar sesión desde localStorage al iniciar la app
- Proporcionar funciones para login/logout
- Sincronizar cambios automáticamente

**Métodos principales:**
```javascript
const { 
  user,              // Datos del usuario autenticado
  token,             // JWT token
  userRole,          // Rol del usuario (cliente, groomer, admin)
  isLoading,         // Estado de carga inicial
  isAuthenticated,   // Boolean si hay sesión activa
  saveSession,       // (token, user, role) - Guardar sesión
  updateUserData,    // (data) - Actualizar datos del usuario
  logout,            // () - Cerrar sesión
  getAuthHeader,     // () - Obtener headers de autenticación
} = useUser();
```

## Flujo de Autenticación

### 1️⃣ Login (Auth.jsx)
```javascript
const { saveSession } = useUser();

// Después de validación
const data = await loginUser(email, password);
saveSession(data.access_token, data.user, data.user.role);
```

**Result:**
- Token guardado en localStorage + state del contexto
- Datos del usuario sincronizados
- User.role determina redirección

### 2️⃣ Sesión Persistente (App.js)
```javascript
<UserProvider>  {/* Carga sesión desde localStorage */}
  <ThemeProvider>
    <Router>...</Router>
  </ThemeProvider>
</UserProvider>
```

**Al cargar:**
1. UserProvider revisa localStorage
2. Si hay token + user válidos, los carga en estado
3. Componentes pueden usar `useUser()` inmediatamente

### 3️⃣ Acceso a Datos (Cualquier componente)
```javascript
import { useUser } from 'components/UserContext';

function MyComponent() {
  const { user, token, isAuthenticated } = useUser();
  
  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }
  
  return <div>{user.email}</div>;
}
```

### 4️⃣ Logout (GroomerLayout, AdminLayout, etc.)
```javascript
const { logout } = useUser();

const handleLogout = () => {
  logout();  // Limpia todo automáticamente
  navigate('/login');
};
```

**Limpieza:**
- Token removido
- User removido
- userRole removido
- rememberedEmail removido

## Archivos Modificados

### Core
- ✅ `frontend/src/components/UserContext.jsx` - Nuevo contexto
- ✅ `frontend/src/components/SessionDebugger.jsx` - Debug helper
- ✅ `frontend/src/api/diagnostics.js` - Herramientas de diagnóstico

### Integración
- ✅ `frontend/src/App.js` - Envuelto con UserProvider
- ✅ `frontend/src/pages/auth/Auth.jsx` - Usa saveSession()
- ✅ `frontend/src/pages/client/ClientLayout.jsx` - Usa useUser()
- ✅ `frontend/src/pages/groomer/GroomerLayout.jsx` - Usa logout()
- ✅ `frontend/src/pages/admin/AdminLayout.jsx` - Usa logout()
- ✅ `frontend/src/pages/client/profile/ClientProfile.jsx` - Mejor error handling

### APIs
- ✅ `frontend/src/api/userProfile.js` - Mejorado con logging

## Datos de Usuario Disponibles

### Campos en `user`
```javascript
{
  id: 123,
  email: "usuario@example.com",
  full_name: "Juan Pérez",        // o nombre_completo
  phone: "+57300123456",          // o telefono
  role: "cliente",
  direccion: "Calle 1 #123",
  // ... otros campos según el rol
}
```

## Manejo de Errores Mejorado

### ClientProfile.jsx
- Si el fetch falla, carga datos del contexto como fallback
- Muestra mensaje diferenciado (❌ vs ⚠️)
- Logging en consola para debugging

### Diagnostics
```javascript
// Verificar que servicios están disponibles
const { checkServices, validateToken, checkSession } = useDiagnostics();

const services = await checkServices();
const tokenValid = await validateToken();
```

## Debug en Desarrollo

**SessionDebugger** (esquina inferior izquierda en desarrollo)

- Muestra estado de autenticación
- Verifica disponibilidad de servicios
- Valida token JWT
- Solo visible cuando `NODE_ENV === 'development'`

## Troubleshooting

### ❌ "Failed to fetch" en ClientProfile
1. Verificar que puerto 3009 está corriendo
2. Usar SessionDebugger para ver estado de servicios
3. Revisar consola para logs detallados
4. Confirmar que token es válido

### ❌ Sesión no persiste después de refresh
- UserProvider carga automáticamente desde localStorage
- Si no aparece, revisar Application > Storage > localStorage

### ❌ Usuario no aparece en componentes
- Usar `useUser()` para acceder (NO localStorage)
- Verificar que UserProvider envuelve toda la app

## Ejemplo Completo: Cargar Perfil

```javascript
import { useUser } from 'components/UserContext';
import { getMyProfile } from 'api/userProfile';

function ProfilePage() {
  const { user, token, getAuthHeader } = useUser();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        // El token se envía automáticamente
        const data = await getMyProfile();
        setProfile(data);
      } catch (err) {
        console.error('Error:', err);
        // Fallback a datos del contexto
        if (user) setProfile(user);
      }
    }
    
    load();
  }, [user]);

  return <div>{profile?.email}</div>;
}
```

## Próximas Mejoras

- [ ] Refresh automático de token antes de expirar
- [ ] Sincronizar sesión entre pestañas
- [ ] Servicio de actualización de perfil en tiempo real
- [ ] Validación de permisos en rutas

---

**Última actualización:** Mayo 25, 2026  
**Responsable:** Sistema de Autenticación Paseos Felices
