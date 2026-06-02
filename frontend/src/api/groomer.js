import { API, fetchWithTimeout } from './config';
import { tokenStore } from './tokenStore';

export async function getGroomerProfile() {
  try {
    const userRes = await fetchWithTimeout(`${API.auth}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      timeout: 5000
    });
    
    if (!userRes.ok) {
      throw new Error('No pudimos obtener tu información de usuario. Por favor, intenta nuevamente.');
    }
    
    const userData = await userRes.json();
    const email = userData.email;
    
    if (!email) {
      throw new Error('No pudimos obtener tu correo electrónico. Por favor, intenta nuevamente.');
    }
    
    const res = await fetchWithTimeout(`${API.groomer}/groomers/email/${email}`, {
      headers: tokenStore.getAuthHeader(),
      timeout: 15000
    });

    let data;
    if (res.ok) {
      data = await res.json();
    } else {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'No pudimos cargar tu perfil de groomer. Por favor, intenta nuevamente.');
    }

    // Si data es null, significa que no existe perfil de groomer
    if (!data) {
      return null;
    }

    return data;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Tiempo de espera agotado. El servicio está tardando demasiado en responder.');
    }
    throw error;
  }
}

export async function getGroomersByService(service) {
  const res = await fetchWithTimeout(`${API.groomer}/groomers/?service=${encodeURIComponent(service)}`, {
    headers: tokenStore.getAuthHeader(),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'No pudimos cargar los groomers disponibles. Por favor, intenta nuevamente.');
  }
  return res.json();
}

export async function getAllGroomers() {
  const res = await fetchWithTimeout(`${API.groomer}/groomers/`, {
    headers: tokenStore.getAuthHeader(),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'No pudimos cargar los groomers. Por favor, intenta nuevamente.');
  }
  return res.json();
}

export async function getGroomerByEmail(email) {
  const res = await fetchWithTimeout(`${API.groomer}/groomers/email/${encodeURIComponent(email)}`, {
    headers: tokenStore.getAuthHeader(),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'No pudimos cargar el groomer. Por favor, intenta nuevamente.');
  }
  // El servicio devuelve null cuando no existe perfil
  return res.json();
}

export async function createGroomerProfile(data) {
  const res = await fetchWithTimeout(`${API.groomer}/groomers/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...tokenStore.getAuthHeader(),
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'No pudimos crear tu perfil de groomer. Por favor, verifica los datos e intenta nuevamente.');
  }
  return res.json();
}

export async function updateGroomerProfile(id, data) {
  const res = await fetchWithTimeout(`${API.groomer}/groomers/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...tokenStore.getAuthHeader(),
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'No pudimos actualizar tu perfil de groomer. Por favor, verifica los datos e intenta nuevamente.');
  }
  return res.json();
}

export async function addServiceToGroomer(groomerId, serviceId) {
  const res = await fetchWithTimeout(`${API.groomer}/groomers/${groomerId}/services/${serviceId}`, {
    method: 'POST',
    headers: tokenStore.getAuthHeader(),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'No pudimos agregar el servicio a tu perfil. Por favor, intenta nuevamente.');
  }
  return res.json();
}

export async function removeServiceFromGroomer(groomerId, serviceId) {
  const res = await fetchWithTimeout(`${API.groomer}/groomers/${groomerId}/services/${serviceId}`, {
    method: 'DELETE',
    headers: tokenStore.getAuthHeader(),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'No pudimos eliminar el servicio de tu perfil. Por favor, intenta nuevamente.');
  }
  return null;
}
