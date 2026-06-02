import { API, fetchWithTimeout } from './config';
import { tokenStore } from './tokenStore';

export async function getMyInvoices() {
  const res = await fetchWithTimeout(`${API.appointments}/invoices/me`, {
    headers: tokenStore.getAuthHeader(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'No pudimos cargar tus facturas.');
  }
  return res.json();
}

export async function getGroomerInvoices() {
  const res = await fetchWithTimeout(`${API.appointments}/invoices/groomer`, {
    headers: tokenStore.getAuthHeader(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'No pudimos cargar tus facturas.');
  }
  return res.json();
}

export async function getAllInvoices(status) {
  const qs = status ? `?status_filter=${encodeURIComponent(status)}` : '';
  const res = await fetchWithTimeout(`${API.appointments}/invoices${qs}`, {
    headers: tokenStore.getAuthHeader(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'No pudimos cargar las facturas.');
  }
  return res.json();
}

export async function getInvoicesAdmin({ status, clientEmail, groomerEmail } = {}) {
  const params = new URLSearchParams();
  if (status) params.set('status_filter', status);
  if (clientEmail) params.set('client_email', clientEmail);
  if (groomerEmail) params.set('groomer_email', groomerEmail);

  const qs = params.toString() ? `?${params.toString()}` : '';
  const res = await fetchWithTimeout(`${API.appointments}/invoices${qs}`, {
    headers: tokenStore.getAuthHeader(),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'No pudimos cargar las facturas (admin).');
  }
  return res.json();
}

export async function getInvoice(id) {
  const res = await fetchWithTimeout(`${API.appointments}/invoices/${id}`, {
    headers: tokenStore.getAuthHeader(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'No pudimos cargar la factura.');
  }
  return res.json();
}

export async function downloadInvoicePdf(id) {
  const res = await fetchWithTimeout(`${API.appointments}/invoices/${id}/pdf`, {
    headers: tokenStore.getAuthHeader(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'No pudimos descargar el PDF.');
  }
  const blob = await res.blob();
  return blob;
}
