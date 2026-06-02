// Configuración central de los microservicios
export const API = {
  auth: 'http://localhost:8000',
  pets: 'http://localhost:3022',
  appointments: 'http://localhost:3023',
  servicesCatalog: 'http://localhost:3014',
  userProfile: 'http://localhost:3009',
  groomer: 'http://localhost:3025',
  reviews: 'http://localhost:3007',
};

// Para compatibilidad con código antiguo
export const API_BASE = API.auth;

// Timeout para fetch requests (20 segundos)
export const FETCH_TIMEOUT = 20000;

// Helper para fetch con timeout
export async function fetchWithTimeout(url, options = {}) {
  const timeout = options.timeout || FETCH_TIMEOUT;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error(`Timeout (${timeout}ms): La solicitud tardó demasiado en responder`);
    }
    throw err;
  }
}
