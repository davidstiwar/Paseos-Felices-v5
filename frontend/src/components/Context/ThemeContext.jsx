import React, {
  createContext,
  useContext,
  useState,
  useEffect,
} from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {

  // Obtener tema guardado
  const [darkMode, setDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme === 'dark';
  });

  // Aplicar clases y guardar preferencia
  useEffect(() => {

    const root = document.documentElement;

    if (darkMode) {
      root.classList.add('dark');
      root.classList.remove('light');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }

  }, [darkMode]);

  // Cambiar tema
  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
  };

  return (
    <ThemeContext.Provider
      value={{
        darkMode,
        toggleDarkMode,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

// Hook personalizado
export const useTheme = () => useContext(ThemeContext);

/* ============================================
   BOTÓN TOGGLE
============================================ */

export const ThemeToggle = ({
  variant = 'default',
  showLabel = false,
}) => {

  const { darkMode, toggleDarkMode } = useTheme();

  const isSidebar = variant === 'sidebar';

  return (
    <button
      onClick={toggleDarkMode}
      className={`theme-toggle ${
        isSidebar ? 'theme-toggle--sidebar' : ''
      }`}
      aria-label={
        darkMode
          ? 'Cambiar a modo claro'
          : 'Cambiar a modo oscuro'
      }
      title={
        darkMode
          ? 'Modo claro'
          : 'Modo oscuro'
      }
    >

      <span className="theme-icon">
        {darkMode ? '☀️' : '🌙'}
      </span>

      {(showLabel || isSidebar) && (
        <span className="theme-label">
          {darkMode
            ? 'Modo claro'
            : 'Modo oscuro'}
        </span>
      )}

    </button>
  );
};