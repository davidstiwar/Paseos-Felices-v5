import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { ThemeToggle } from '../../components/Context/ThemeContext';
import { useUser } from '../../components/Context/UserContext';
import NavToggle from '../../components/Layout/NavToggle';

const ClientLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const { user, logout } = useUser();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { to: "/client", label: "Dashboard", icon: "📊", end: true },
    { to: "/client/profile", label: "Mi Perfil", icon: "👤" },
    { to: "/client/pets", label: "Mis Mascotas", icon: "🐾" },
    { to: "/client/appointments", label: "Mis Citas", icon: "📅" },
    { to: "/client/invoices", label: "Facturas", icon: "🧾" },
    { to: "/client/history", label: "Historial", icon: "📜" },
  ];

  const userName = user?.full_name || user?.nombre_completo || user?.email?.split('@')[0] || 'Usuario';

  return (
    <div className="client-layout">
      {/* Sidebar Retractable */}
      <aside className={`client-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo">
            🐾 <span className="logo-text">Paseos Felices</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => 
                `sidebar-link ${isActive ? 'active' : ''}`
              }
              onClick={() => {
                // Cerrar sidebar en móvil al navegar
                if (window.innerWidth <= 900) {
                  setSidebarOpen(false);
                }
              }}
            >
              <span className="sidebar-icon">{item.icon}</span>
              <span className="sidebar-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">👋</div>
            <div className="user-details">
              <span className="user-name">{userName}</span>
              <span className="user-role">Cliente</span>
            </div>
          </div>

          {/* Botón de Modo Oscuro/Claro */}
          <div className="sidebar-theme-toggle">
            <ThemeToggle variant="sidebar" />
          </div>

          <button 
            className="logout-btn" 
            onClick={handleLogout}
            title="Cerrar sesión"
          >
            🚪 Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="client-main">
        <header className="client-header">
          <NavToggle
            isOpen={sidebarOpen}
            onToggle={() => setSidebarOpen(!sidebarOpen)}
            className="sidebar-toggle"
          />
          <div className="header-title">Panel del Cliente</div>
        </header>

        <main className="client-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default ClientLayout;
