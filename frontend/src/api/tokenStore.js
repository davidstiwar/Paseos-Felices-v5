/**
 * Token Store - Almacenamiento centralizado de token para APIs
 * Se sincroniza automáticamente con UserContext
 */

class TokenStore {
  constructor() {
    this.token = this.loadToken();
    this.listeners = [];
  }

  loadToken() {
    try {
      return localStorage.getItem('token') || null;
    } catch (err) {
      console.error('Error loading token from localStorage:', err);
      return null;
    }
  }

  /**
   * Actualizar token (llamado desde UserContext)
   */
  setToken(token) {
    this.token = token;
    this.notifyListeners();
  }

  /**
   * Obtener token actual
   */
  getToken() {
    return this.token;
  }

  /**
   * Limpiar token (logout)
   */
  clearToken() {
    this.token = null;
    this.notifyListeners();
  }

  /**
   * Obtener headers de autenticación
   */
  getAuthHeader() {
    return this.token ? { Authorization: `Bearer ${this.token}` } : {};
  }

  /**
   * Suscribirse a cambios de token
   */
  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Notificar listeners
   */
  notifyListeners() {
    this.listeners.forEach(listener => listener(this.token));
  }
}

// Singleton
export const tokenStore = new TokenStore();
