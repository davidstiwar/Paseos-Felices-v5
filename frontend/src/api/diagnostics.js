/**
 * Utilidad de diagnóstico para verificar conexión con APIs
 * y validez de la sesión del usuario
 */

import { API } from './config';

export const diagnostics = {
  /**
   * Verifica que servicios están disponibles
   */
  async checkServices() {
    const services = {
      auth: { url: API.auth, ok: false, error: null },
      pets: { url: API.pets, ok: false, error: null },
      appointments: { url: API.appointments, ok: false, error: null },
      userProfile: { url: API.userProfile, ok: false, error: null },
    };

    for (const service of Object.values(services)) {
      try {
        const res = await fetch(`${service.url}/health`, {
          method: 'GET',
          timeout: 5000,
        });
        service.ok = res.ok;
      } catch (err) {
        service.error = err.message;
      }
    }

    return services;
  },

  /**
   * Verifica que el token es válido
   */
  async validateToken() {
    const token = localStorage.getItem('token');
    if (!token) {
      return { valid: false, reason: 'No token in localStorage' };
    }

    try {
      // Intentar obtener el perfil del usuario
      const res = await fetch(`${API.userProfile}/profiles/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        return { valid: true, user: await res.json() };
      } else if (res.status === 401) {
        return { valid: false, reason: 'Token expired or invalid (401)' };
      } else {
        return { valid: false, reason: `Server error: ${res.status}` };
      }
    } catch (err) {
      return { valid: false, reason: `Network error: ${err.message}` };
    }
  },

  /**
   * Verifica la sesión completa del usuario
   */
  async checkSession() {
    const session = {
      token: localStorage.getItem('token') ? 'Present' : 'Missing',
      userRole: localStorage.getItem('userRole') || 'No role',
      user: localStorage.getItem('user') ? 'Present' : 'Missing',
      services: null,
      tokenValid: null,
    };

    session.services = await this.checkServices();
    session.tokenValid = await this.validateToken();

    return session;
  },

  /**
   * Log completo para debugging
   */
  async logDiagnostics() {
    const diagnostics = await this.checkSession();
    console.group('🔍 Session Diagnostics');
    console.log('Session Status:', diagnostics);
    console.log('Services Status:', diagnostics.services);
    console.log('Token Valid:', diagnostics.tokenValid);
    console.groupEnd();
    return diagnostics;
  },
};

/**
 * Hook para usar diagnósticos en componentes
 */
export const useDiagnostics = () => {
  const checkServices = async () => {
    return await diagnostics.checkServices();
  };

  const validateToken = async () => {
    return await diagnostics.validateToken();
  };

  const checkSession = async () => {
    return await diagnostics.checkSession();
  };

  return { checkServices, validateToken, checkSession };
};
