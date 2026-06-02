import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { tokenStore } from '../../api/tokenStore';

// Crear el contexto
const UserContext = createContext();

/**
 * UserProvider: Componente que gestiona la sesión del usuario en toda la app
 * - Persiste sesión en localStorage
 * - Proporciona funciones para login/logout
 * - Mantiene datos de usuario sincronizados
 */
export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar sesión desde localStorage al montar el componente
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('token');
      const storedRole = localStorage.getItem('userRole');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUserRole(storedRole || 'cliente');
        setUser(JSON.parse(storedUser));
      }
    } catch (err) {
      console.error('Error loading session from localStorage:', err);
      // Limpiar en caso de error
      localStorage.removeItem('token');
      localStorage.removeItem('userRole');
      localStorage.removeItem('user');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Guardar sesión: actualiza estado y localStorage
   */
  const saveSession = useCallback((newToken, newUser, newRole = 'cliente') => {
    try {
      setToken(newToken);
      setUser(newUser);
      setUserRole(newRole);

      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(newUser));
      localStorage.setItem('userRole', newRole);
      
      // Actualizar token store para APIs
      tokenStore.setToken(newToken);
    } catch (err) {
      console.error('Error saving session:', err);
    }
  }, []);

  /**
   * Actualizar datos del usuario
   */
  const updateUserData = useCallback((updatedData) => {
    try {
      const updatedUser = { ...user, ...updatedData };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    } catch (err) {
      console.error('Error updating user data:', err);
    }
  }, [user]);

  /**
   * Cerrar sesión: limpiar estado y localStorage
   */
  const logout = useCallback(() => {
    try {
      setUser(null);
      setToken(null);
      setUserRole(null);

      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('userRole');
      localStorage.removeItem('rememberedEmail');
      
      // Limpiar token store para APIs
      tokenStore.clearToken();
    } catch (err) {
      console.error('Error during logout:', err);
    }
  }, []);

  /**
   * Verificar si hay sesión activa
   */
  const isAuthenticated = useCallback(() => {
    return !!token && !!user;
  }, [token, user]);

  /**
   * Obtener token para headers de autenticación
   */
  const getAuthHeader = useCallback(() => {
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, [token]);

  const value = {
    user,
    token,
    userRole,
    isLoading,
    isAuthenticated: isAuthenticated(),
    saveSession,
    updateUserData,
    logout,
    getAuthHeader,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

/**
 * Hook para usar el contexto de usuario
 * Uso: const { user, token, logout } = useUser();
 */
export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser debe ser usado dentro de un UserProvider');
  }
  return context;
};
