/**
 * Utilidades para manejar imágenes de forma segura en toda la aplicación
 */

/**
 * Valida si una URL es válida y no está vacía
 * @param {string} url - URL a validar
 * @returns {boolean} - true si la URL es válida
 */
export const isValidImageUrl = (url) => {
  if (!url || typeof url !== 'string') {
    return false;
  }

  const trimmedUrl = url.trim();
  
  // Rechazar cadenas vacías
  if (trimmedUrl === '') {
    return false;
  }

  // Validar URLs de datos (base64)
  if (trimmedUrl.startsWith('data:')) {
    // Validar que tenga el formato correcto: data:image/xxx;base64,xxxxx
    return /^data:image\/[a-zA-Z0-9]+;base64,[A-Za-z0-9+/=]+$/.test(trimmedUrl);
  }

  // Validar URLs http/https
  if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
    try {
      new URL(trimmedUrl);
      return true;
    } catch {
      return false;
    }
  }

  // Aceptar object URLs generadas por URL.createObjectURL (blob:)
  if (trimmedUrl.startsWith('blob:')) {
    return true;
  }

  // Validar URLs relativas (/img/...)
  if (trimmedUrl.startsWith('/')) {
    return true;
  }

  return false;
};

/**
 * Obtiene una URL de imagen segura con fallback a placeholder
 * @param {string|null|undefined} url - URL a validar
 * @param {string} placeholder - URL del placeholder por defecto
 * @returns {string} - URL válida o placeholder
 */
export const getSafeImageUrl = (url, placeholder = '🐾') => {
  if (isValidImageUrl(url)) {
    try {
      const trimmed = url.trim();
      // Encode URI to handle spaces and special characters
      return encodeURI(trimmed);
    } catch {
      return url;
    }
  }
  return placeholder;
};

/**
 * Obtiene una URL de imagen con múltiples intentos de propiedades
 * Útil cuando los datos vienen de diferentes APIs con nombres de propiedades inconsistentes
 * @param {object} obj - Objeto que contiene la imagen
 * @param {array} propertyNames - Nombres de propiedades a intentar en orden de prioridad
 * @param {string} placeholder - URL del placeholder por defecto
 * @returns {string} - URL válida o placeholder
 */
export const getImageUrlFromObject = (obj, propertyNames = [], placeholder = '🐾') => {
  if (!obj || typeof obj !== 'object') {
    return placeholder;
  }

  for (const prop of propertyNames) {
    if (isValidImageUrl(obj[prop])) {
      return obj[prop];
    }
  }

  return placeholder;
};

/**
 * Convierte una data URL (base64) a un objeto Blob y retorna un object URL (`blob:`).
 * Retorna `null` si la conversión falla.
 * @param {string} dataUrl
 * @returns {string|null}
 */
export const dataUrlToBlobUrl = (dataUrl) => {
  try {
    if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:')) return null;

    const parts = dataUrl.split(',');
    if (parts.length !== 2) return null;

    const meta = parts[0];
    const b64 = parts[1];
    // Protección básica: limitar tamaño razonable (ej. 10MB) para evitar abusos
    const approxSize = Math.ceil((b64.length * 3) / 4);
    const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
    if (approxSize > MAX_BYTES) return null;

    const mimeMatch = meta.match(/data:([^;]+);base64/);
    const mime = (mimeMatch && mimeMatch[1]) || 'application/octet-stream';

    const byteString = atob(b64);
    const arr = new Uint8Array(byteString.length);
    for (let i = 0; i < byteString.length; i++) arr[i] = byteString.charCodeAt(i);
    const blob = new Blob([arr], { type: mime });
    return URL.createObjectURL(blob);
  } catch (e) {
    console.warn('[imageUtils] dataUrlToBlobUrl failed', e);
    return null;
  }
};

/**
 * Maneja errores de carga de imagen y registra en consola
 * @param {Event} event - Evento de error de imagen
 * @param {string} identifier - Identificador para debugging (nombre, id, etc.)
 */
export const handleImageError = (event, identifier = 'Unknown') => {
  const src = event.target?.src || 'Unknown';
  console.warn(`[ImageLoadError] Failed to load image for ${identifier}:`, src);
  // Evitar reemplazar indefinidamente si el fallback también falla
  try {
    const img = event.target;
    if (!img) return;
    if (img.dataset && img.dataset.fallbackApplied) return;

    // SVG simple como placeholder embebido (pequeño avatar)
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160' viewBox='0 0 24 24' fill='none' stroke='%23d96c5f' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'><circle cx='12' cy='8' r='3'/><path d='M20.24 21a8 8 0 0 0-16.48 0'/></svg>`;
    const fallback = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

    if (img.dataset) img.dataset.fallbackApplied = '1';
    img.src = fallback;
    img.alt = img.alt || 'Avatar';
  } catch (e) {
    // No detener la aplicación si algo falla aquí
    console.warn('handleImageError fallback failed', e);
  }
};

/**
 * Procesa una lista de objetos con imágenes
 * @param {array} items - Lista de objetos que pueden contener imágenes
 * @param {array} imagePropertyNames - Nombres de propiedades que pueden contener la URL
 * @returns {array} - Lista procesada con URLs de imagen seguras
 */
export const processItemsWithImages = (items, imagePropertyNames = []) => {
  if (!Array.isArray(items)) {
    return [];
  }

  return items.map((item) => {
    if (typeof item !== 'object') {
      return item;
    }

    // Para cada propiedad que podría contener una imagen, validarla
    const processed = { ...item };
    imagePropertyNames.forEach((prop) => {
      if (prop in processed) {
        processed[prop] = getSafeImageUrl(processed[prop]);
      }
    });

    return processed;
  });
};

/**
 * Intenta precargar una imagen y resuelve true si carga correctamente
 * @param {string} url
 * @param {number} timeout ms
 * @returns {Promise<boolean>}
 */
export const preloadImage = (url, timeout = 10000) => {
  return new Promise((resolve) => {
    if (!isValidImageUrl(url)) return resolve(false);
    try {
      const img = new Image();
      let settled = false;
      const timer = setTimeout(() => {
        if (settled) return;
        settled = true;
        img.onload = img.onerror = null;
        resolve(false);
      }, timeout);

      img.onload = () => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(true);
      };
      img.onerror = () => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(false);
      };
      img.src = encodeURI(url.trim());
    } catch (e) {
      resolve(false);
    }
  });
};
