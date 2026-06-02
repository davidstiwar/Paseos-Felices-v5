import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../../estilos/Navbar.css';
import { ThemeToggle } from '../Context/ThemeContext';
import NavToggle from './NavToggle';
import { useUser } from '../Context/UserContext';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const { user, isAuthenticated, userRole, logout } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Cierra automáticamente el menú móvil al pasar a desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768 && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen]);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
    setIsOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsOpen(false);
  };

  const handleUserDashboard = () => {
    if (userRole === 'admin') {
      navigate('/admin');
    } else if (userRole === 'groomer') {
      navigate('/groomer');
    } else {
      navigate('/client');
    }
    setIsOpen(false);
    setUserDropdownOpen(false);
  };

  const toggleUserDropdown = () => {
    setUserDropdownOpen(!userDropdownOpen);
  };

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="nav-content">
        <Link to="/" className="logo" aria-label="Ir a inicio">
          <div className="logo-dot">🐾</div>
          Paseos Felices
        </Link>

        <div className="nav-links">
          <a href="#beneficios">Beneficios</a>
          <a href="#servicios">Servicios</a>
          <a href="#como-funciona">Cómo funciona</a>
          <a href="#resenas">Reseñas</a>
          
          {isAuthenticated && user ? (
            <div className="nav-user-section">
              <div className="user-dropdown-container">
                <button 
                  className="nav-user-button"
                  onClick={toggleUserDropdown}
                  title={`Rol: ${userRole}`}
                >
                  👤 {user.full_name || user.nombre_completo || user.name || 'Usuario'}
                  <span className="dropdown-arrow">▼</span>
                </button>
                {userDropdownOpen && (
                  <div className="user-dropdown-menu">
                    <div className="dropdown-header">
                      <span className="dropdown-user-name">{user.full_name || user.nombre_completo || user.name || 'Usuario'}</span>
                      <span className="dropdown-user-role">{userRole}</span>
                    </div>
                    <button 
                      className="dropdown-item"
                      onClick={handleUserDashboard}
                    >
                      📊 Ir a Dashboard
                    </button>
                    <button 
                      className="dropdown-item dropdown-logout"
                      onClick={handleLogout}
                    >
                      🚪 Cerrar Sesión
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <Link to="/login" className="nav-auth-link">Iniciar sesión</Link>
          )}
          
          <button className="cta-button" onClick={() => scrollTo('servicios')}>Reserva ahora</button>
          <ThemeToggle />
        </div>


        <NavToggle 
          isOpen={isOpen} 
          onToggle={() => setIsOpen(!isOpen)} 
          className="hamburger" 
        />
      </div>

      <div className={`mobile-menu ${isOpen ? 'open' : ''}`}>
        <a href="#beneficios" onClick={() => setIsOpen(false)}>Beneficios</a>
        <a href="#servicios" onClick={() => setIsOpen(false)}>Servicios</a>
        <a href="#como-funciona" onClick={() => setIsOpen(false)}>Cómo funciona</a>
        <a href="#resenas" onClick={() => setIsOpen(false)}>Reseñas</a>
        
        {isAuthenticated && user ? (
          <div className="mobile-user-section">
            <div className="mobile-user-dropdown">
              <button 
                className="nav-user-button"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                style={{ width: '100%', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <span>👤 {user.full_name || user.nombre_completo || user.name || 'Usuario'}</span>
                <span>{userDropdownOpen ? '▲' : '▼'}</span>
              </button>
              {userDropdownOpen && (
                <div className="mobile-dropdown-menu">
                  <button 
                    className="dropdown-item"
                    onClick={handleUserDashboard}
                    style={{ width: '100%', textAlign: 'left' }}
                  >
                    📊 Ir a Dashboard
                  </button>
                  <button 
                    className="dropdown-item dropdown-logout"
                    onClick={handleLogout}
                    style={{ width: '100%', textAlign: 'left' }}
                  >
                    🚪 Cerrar Sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <a href="/login" onClick={() => setIsOpen(false)} className="nav-auth-link">Iniciar sesión</a>
        )}
        
        <button className="cta-button" onClick={() => scrollTo('servicios')}>Reserva ahora</button>
        <ThemeToggle showLabel={true} />
      </div>
    </nav>
  );
};


export default Navbar;
