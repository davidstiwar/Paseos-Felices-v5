import { API, fetchWithTimeout } from './config';
import { tokenStore } from './tokenStore';

export async function getCurrentCommissions() {
  const res = await fetchWithTimeout(`${API.appointments}/commissions/current`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'No pudimos cargar las comisiones.');
  }
  return res.json();
}

export async function updateCommissions(data) {
  const res = await fetchWithTimeout(`${API.appointments}/commissions`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...tokenStore.getAuthHeader(),
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'No pudimos actualizar las comisiones.');
  }
  return res.json();
}

export async function getCommissionHistory() {
  const res = await fetchWithTimeout(`${API.appointments}/commissions/history`, {
    headers: tokenStore.getAuthHeader(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'No pudimos cargar el historial de comisiones.');
  }
  return res.json();
}

export async function getFinancialSummary() {
  const res = await fetchWithTimeout(`${API.appointments}/financial/summary`, {
    headers: tokenStore.getAuthHeader(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'No pudimos cargar el resumen financiero.');
  }
  return res.json();
}

export async function getFinancialByGroomer() {
  const res = await fetchWithTimeout(`${API.appointments}/financial/by-groomer`, {
    headers: tokenStore.getAuthHeader(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'No pudimos cargar el reporte por groomer.');
  }
  return res.json();
}

export async function getFinancialByService() {
  const res = await fetchWithTimeout(`${API.appointments}/financial/by-service`, {
    headers: tokenStore.getAuthHeader(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'No pudimos cargar el reporte por servicio.');
  }
  return res.json();
}
