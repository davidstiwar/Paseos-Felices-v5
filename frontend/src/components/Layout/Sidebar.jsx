import React, { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { ThemeToggle } from '../Context/ThemeContext';
import { useUser } from '../Context/UserContext';
import NavToggle from './NavToggle';

/**
 * Sidebar - Componente de navegación lateral unificado
 * Reutilizable para Admin, Client y Groomer layouts
 */
export default function Sidebar({
  isOpen,
  onToggle,
  menuItems,
  user,
  onLogout,
  branding,
  theme,
  variant = 'default', // 'admin', 'client', 'groomer'
  className = '',
}) {
  const [openSubmenus, setOpenSubmenus] = useState({});
  const location = useLocation();

  const isActive = (path) => {
    if (variant === 'groomer') {
      return location.pathname.includes(path);
    }
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const toggleSubmenu = (label) => {
    setOpenSubmenus(prev => ({
      ...prev,
      [label]: !prev[label]
    }));
  };

  const handleLogout = () => {
    if (onLogout) onLogout();
  };

  const userName = user?.full_name || user?.nombre_completo || user?.email?.split('@')[0] || 'Usuario';
  const userRole = variant === 'admin' ? 'Admin' : variant === 'groomer' ? 'Groomer' : 'Cliente';

  const sidebarClass = [
    'sidebar',
    `sidebar-${variant}`,
    isOpen ? 'open' : 'closed',
    className
  ].filter(Boolean).join(' ');

  return (
    <aside className={sidebarClass}>
      {/* Header */}
      <div className="sidebar-header">
        <div className="logo">
          {branding?.logo || '🐾'}{' '}
          {isOpen && <span className="logo-text">{branding?.name || 'Paseos Felices'}</span>}
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {menuItems.map((item, index) => {
          // Handle submenu items
          if (item.children) {
            const isOpenSubmenu = openSubmenus[item.label];
            const isParentActive = item.children.some(child => isActive(child.path));

            return (
              <div key={index}>
                <div
                  className={`sidebar-link ${isParentActive ? 'active' : ''}`}
                  onClick={() => toggleSubmenu(item.label)}
                  style={{ cursor: 'pointer' }}
                >
                  <span className="sidebar-icon">{item.icon}</span>
                  {isOpen && (
                    <>
                      <span className="sidebar-label">{item.label}</span>
                      <span style={{ marginLeft: 'auto', fontSize: '10px' }}>
                        {isOpenSubmenu ? '▼' : '▶'}
                      </span>
                    </>
                  )}
                </div>
                {isOpen && isOpenSubmenu && (
                  <div className="submenu">
                    {item.children.map((child, childIndex) => (
                      <Link
                        key={childIndex}
                        to={child.path}
                        className={`sidebar-link submenu-link ${isActive(child.path) ? 'active' : ''}`}
                      >
                        <span className="sidebar-label" style={{ paddingLeft: '32px' }}>
                          {child.label}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          // Handle regular nav items
          const LinkComponent = variant === 'client' ? NavLink : Link;
          const linkProps = variant === 'client' 
            ? { to: item.to, end: item.end }
            : { to: item.path };

          return (
            <LinkComponent
              key={index}
              {...linkProps}
              className={({ isActive: isLinkActive }) => 
                `sidebar-link ${isLinkActive || isActive(item.path || item.to) ? 'active' : ''}`
              }
              onClick={() => {
                // Close sidebar on mobile when navigating
                if (window.innerWidth <= 900 && onToggle) {
                  onToggle(false);
                }
              }}
            >
              <span className="sidebar-icon">{item.icon}</span>
              {isOpen && <span className="sidebar-label">{item.label}</span>}
            </LinkComponent>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        {variant === 'client' && (
          <div className="user-info">
            <div className="user-avatar">👋</div>
            {isOpen && (
              <div className="user-details">
                <span className="user-name">{userName}</span>
                <span className="user-role">{userRole}</span>
              </div>
            )}
          </div>
        )}

        {/* Theme Toggle */}
        <div className="sidebar-theme-toggle">
          <ThemeToggle variant="sidebar" />
        </div>

        {/* Logout Button */}
        <button 
          className="logout-btn"
          onClick={handleLogout}
          title="Cerrar sesión"
        >
          <span className="sidebar-icon">🚪</span>
          {isOpen && <span>{variant === 'groomer' ? 'Salir' : 'Cerrar Sesión'}</span>}
        </button>
      </div>
    </aside>
  );
}
