import React, { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import '../../estilos/ClientPanel.css';
import '../../estilos/GroomerLayout.css';
import { ThemeToggle } from '../../components/Context/ThemeContext';
import { useUser } from '../../components/Context/UserContext';
import NavToggle from '../../components/Layout/NavToggle';

const GroomerLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useUser();

  const isActive = (path) => location.pathname.includes(path);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { path: '/groomer/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/groomer/services', label: 'Mis Servicios', icon: '📅' },
    { path: '/groomer/pets', label: 'Mascotas Atendidas', icon: '🐾' },
    { path: '/groomer/history', label: 'Historial', icon: '📜' },
    { path: '/groomer/statistics', label: 'Estadísticas', icon: '📈' },
    { path: '/groomer/invoices', label: 'Facturas', icon: '🧾' },
    { path: '/groomer/profile', label: 'Mi Perfil', icon: '👤' },
  ];

  return (
    <div className="groomer-layout client-layout">
      {/* Sidebar */}
      <aside className={`groomer-sidebar client-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="groomer-sidebar-header sidebar-header">
          <h2>🐕 PetCare</h2>
        </div>

        <nav className="groomer-nav sidebar-nav">
          {menuItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item sidebar-link ${isActive(item.path) ? 'active' : ''}`}
            >
              <span className="nav-icon sidebar-icon">{item.icon}</span>
              {sidebarOpen && <span className="nav-label sidebar-label">{item.label}</span>}
            </Link>
          ))}
        </nav>

        <div className="groomer-sidebar-footer">
          {/* Botón de Modo Oscuro/Claro */}
          <div className="sidebar-theme-toggle">
            <ThemeToggle variant="sidebar" />
          </div>

          <button 
            className="logout-btn"
            onClick={handleLogout}
            title="Cerrar sesión"
          >
            <span className="nav-icon">🚪</span>
            {sidebarOpen && <span>Salir</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="groomer-main-content client-main">
        {/* Top Bar */}
        <div className="groomer-topbar client-header">
          <div className="topbar-left">
            <NavToggle 
              isOpen={sidebarOpen} 
              onToggle={() => setSidebarOpen(!sidebarOpen)}
              className="sidebar-toggle"
            />
            <h1>Groomer Panel</h1>
          </div>
        </div>

        {/* Content Area */}
        <div className="groomer-content client-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default GroomerLayout;
