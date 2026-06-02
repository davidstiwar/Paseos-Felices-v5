import { API, fetchWithTimeout } from './config';
import { tokenStore } from './tokenStore';

export async function getAllServices(activeOnly = true) {
  const res = await fetchWithTimeout(`${API.servicesCatalog}/catalog/?active_only=${activeOnly}`);

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'No pudimos cargar el catálogo de servicios. Por favor, intenta nuevamente.');
  }
  return res.json();
}

export async function getService(id) {
  const res = await fetchWithTimeout(`${API.servicesCatalog}/catalog/${id}`);

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'No pudimos cargar el servicio. Por favor, intenta nuevamente.');
  }
  return res.json();
}

export async function createService(data) {
  const res = await fetchWithTimeout(`${API.servicesCatalog}/catalog/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...tokenStore.getAuthHeader(),
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'No pudimos crear el servicio. Por favor, verifica los datos e intenta nuevamente.');
  }
  return res.json();
}

export async function updateService(id, data) {
  const res = await fetchWithTimeout(`${API.servicesCatalog}/catalog/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...tokenStore.getAuthHeader(),
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'No pudimos actualizar el servicio. Por favor, verifica los datos e intenta nuevamente.');
  }
  return res.json();
}

export async function deleteService(id) {
  const res = await fetchWithTimeout(`${API.servicesCatalog}/catalog/${id}`, {
    method: 'DELETE',
    headers: tokenStore.getAuthHeader(),
  });

  if (!res.ok && res.status !== 204) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'No pudimos eliminar el servicio. Por favor, intenta nuevamente.');
  }
  return true;
}
