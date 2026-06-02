import React, { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import '../../estilos/ClientPanel.css';
import { ThemeToggle } from '../../components/Context/ThemeContext';
import { useUser } from '../../components/Context/UserContext';
import NavToggle from '../../components/Layout/NavToggle';

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [openSubmenus, setOpenSubmenus] = useState({});
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useUser();

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  const toggleSubmenu = (label) => {
    setOpenSubmenus(prev => ({
      ...prev,
      [label]: !prev[label]
    }));
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/admin/users', label: 'Usuarios', icon: '👥' },
    { path: '/admin/groomer-applications', label: 'Solicitudes Groomers', icon: '🐕' },
    { path: '/admin/services', label: 'Servicios', icon: '📋' },
    { path: '/admin/appointments', label: 'Citas', icon: '📅' },
    { path: '/admin/reports', label: 'Reportes', icon: '📈' },
    { path: '/admin/invoices', label: 'Facturas', icon: '🧾' },
    { path: '/admin/commissions', label: 'Comisiones', icon: '⚙️' },
    { path: '/admin/financial-reports', label: 'Finanzas', icon: '💰' },
    { path: '/admin/profile', label: 'Mi Perfil', icon: '👤' },
  ];

  return (
    <div className="admin-layout client-layout">
      {/* Sidebar */}
      <aside className={`admin-sidebar client-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="admin-sidebar-header sidebar-header">
          <h2>🛡️ Admin Panel</h2>
        </div>

        <nav className="admin-nav sidebar-nav">
          {menuItems.map(item => {
            if (item.children) {
              const isOpen = openSubmenus[item.label];
              const isParentActive = item.children.some(child => isActive(child.path));

              return (
                <div key={item.label}>
                  <div
                    className={`nav-item sidebar-link ${isParentActive ? 'active' : ''}`}
                    onClick={() => toggleSubmenu(item.label)}
                    style={{ cursor: 'pointer' }}
                  >
                    <span className="nav-icon sidebar-icon">{item.icon}</span>
                    {sidebarOpen && (
                      <>
                        <span className="nav-label sidebar-label">{item.label}</span>
                        <span style={{ marginLeft: 'auto', fontSize: '10px' }}>
                          {isOpen ? '▼' : '▶'}
                        </span>
                      </>
                    )}
                  </div>
                  {sidebarOpen && isOpen && (
                    <div className="submenu">
                      {item.children.map(child => (
                        <Link
                          key={child.path}
                          to={child.path}
                          className={`nav-item sidebar-link submenu-link ${isActive(child.path) ? 'active' : ''}`}
                        >
                          <span className="nav-label sidebar-label" style={{ paddingLeft: '32px' }}>
                            {child.label}
                          </span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item sidebar-link ${isActive(item.path) ? 'active' : ''}`}
              >
                <span className="nav-icon sidebar-icon">{item.icon}</span>
                {sidebarOpen && <span className="nav-label sidebar-label">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

         <div className="sidebar-footer">
           <div style={{ marginBottom: '12px' }}>
             <ThemeToggle variant="sidebar" />
           </div>
           <button className="logout-btn" onClick={handleLogout}>
             🚪 Cerrar Sesión
           </button>
         </div>
      </aside>

      {/* Main Content */}
      <div className="admin-main client-main">
        <header className="admin-header client-header">
          <NavToggle 
            isOpen={sidebarOpen} 
            onToggle={() => setSidebarOpen(!sidebarOpen)} 
            className="sidebar-toggle"
          />
           <div className="header-title">Panel de Administrador</div>
        </header>

        <main className="admin-content client-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
