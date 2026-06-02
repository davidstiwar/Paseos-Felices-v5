import { API, fetchWithTimeout } from './config';
import { tokenStore } from './tokenStore';

export async function getAllAppointments() {
  // Admin-only: listado completo (requiere token)
  const res = await fetchWithTimeout(`${API.appointments}/appointments/all`, {
    headers: tokenStore.getAuthHeader(),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'No pudimos cargar las citas. Por favor, intenta nuevamente.');
  }
  return res.json();
}

export async function getPublicServicePopularity() {
  const res = await fetchWithTimeout(`${API.appointments}/appointments/public/service-popularity`);

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'No pudimos cargar la popularidad de servicios.');
  }
  return res.json(); // { items: [{service, count}] }
}

export async function getAllAppointmentsAdmin() {
  const res = await fetchWithTimeout(`${API.appointments}/appointments/all`, {
    headers: tokenStore.getAuthHeader(),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'No pudimos cargar las citas (admin).');
  }
  return res.json();
}

export async function getAppointmentsByClientAdmin(email) {
  const res = await fetchWithTimeout(`${API.appointments}/appointments/admin/by-client?email=${encodeURIComponent(email)}`, {
    headers: tokenStore.getAuthHeader(),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'No pudimos cargar el historial de citas del cliente.');
  }
  return res.json();
}

export async function getAppointmentsByGroomerAdmin(email) {
  const res = await fetchWithTimeout(`${API.appointments}/appointments/admin/by-groomer?email=${encodeURIComponent(email)}`, {
    headers: tokenStore.getAuthHeader(),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'No pudimos cargar el historial de servicios del groomer.');
  }
  return res.json();
}

export async function getPublicAppointmentStats() {
  const res = await fetchWithTimeout(`${API.appointments}/appointments/public/stats`);

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'No pudimos cargar las estadísticas de citas. Por favor, intenta nuevamente.');
  }
  return res.json();
}

export async function getAdminMetrics({ fromDate, toDate } = {}) {
  const params = new URLSearchParams();
  if (fromDate) params.set('from_date', fromDate);
  if (toDate) params.set('to_date', toDate);
  const qs = params.toString() ? `?${params.toString()}` : '';

  const res = await fetchWithTimeout(`${API.appointments}/appointments/admin/metrics${qs}`, {
    headers: tokenStore.getAuthHeader(),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'No pudimos cargar las métricas (admin).');
  }
  return res.json();
}

export async function createAppointment(data) {
  const res = await fetchWithTimeout(`${API.appointments}/appointments/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...tokenStore.getAuthHeader(),
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'No pudimos crear tu cita. Por favor, verifica los datos e intenta nuevamente.');
  }
  return res.json();
}

export async function getMyAppointments() {
  const res = await fetchWithTimeout(`${API.appointments}/appointments/`, {
    headers: tokenStore.getAuthHeader(),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'No pudimos cargar tus citas. Por favor, intenta nuevamente.');
  }
  return res.json();
}

export async function getGroomerAppointments() {
  const res = await fetchWithTimeout(`${API.appointments}/appointments/groomer`, {
    headers: tokenStore.getAuthHeader(),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'No pudimos cargar tus citas. Por favor, intenta nuevamente.');
  }
  return res.json();
}

export async function getAppointment(id) {
  const res = await fetchWithTimeout(`${API.appointments}/appointments/${id}`, {
    headers: tokenStore.getAuthHeader(),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'No pudimos cargar la cita. Por favor, intenta nuevamente.');
  }
  return res.json();
}

export async function updateAppointment(id, data) {
  const res = await fetchWithTimeout(`${API.appointments}/appointments/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...tokenStore.getAuthHeader(),
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'No pudimos actualizar tu cita. Por favor, verifica los datos e intenta nuevamente.');
  }
  return res.json();
}

export async function cancelAppointment(id) {
  const res = await fetchWithTimeout(`${API.appointments}/appointments/${id}`, {
    method: 'DELETE',
    headers: tokenStore.getAuthHeader(),
  });

  if (!res.ok && res.status !== 204) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'No pudimos cancelar tu cita. Por favor, intenta nuevamente.');
  }
  return true;
}
