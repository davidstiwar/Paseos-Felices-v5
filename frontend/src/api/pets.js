import { API, fetchWithTimeout } from './config';
import { tokenStore } from './tokenStore';

export async function getAllPets() {
  const res = await fetchWithTimeout(`${API.pets}/pets/all`, {
    headers: tokenStore.getAuthHeader(),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'No pudimos cargar las mascotas. Por favor, intenta nuevamente.');
  }
  return res.json();
}

export async function getMyPets() {
  const res = await fetchWithTimeout(`${API.pets}/pets/`, {
    headers: tokenStore.getAuthHeader(),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'No pudimos cargar tus mascotas. Por favor, intenta nuevamente.');
  }
  return res.json();
}

export async function createPet(data) {
  const res = await fetchWithTimeout(`${API.pets}/pets/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...tokenStore.getAuthHeader(),
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'No pudimos registrar tu mascota. Por favor, verifica los datos e intenta nuevamente.');
  }
  return res.json();
}

export async function updatePet(id, data) {
  const res = await fetchWithTimeout(`${API.pets}/pets/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...tokenStore.getAuthHeader(),
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'No pudimos actualizar la información de tu mascota. Por favor, verifica los datos e intenta nuevamente.');
  }
  return res.json();
}

export async function deletePet(id) {
  const res = await fetchWithTimeout(`${API.pets}/pets/${id}`, {
    method: 'DELETE',
    headers: tokenStore.getAuthHeader(),
  });

  if (!res.ok && res.status !== 204) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'No pudimos eliminar tu mascota. Por favor, intenta nuevamente.');
  }
  return true;
}
