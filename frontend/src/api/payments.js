import { API, fetchWithTimeout } from './config';
import { tokenStore } from './tokenStore';

export async function markInvoicePaid(invoiceId, amount) {
  const res = await fetchWithTimeout(`${API.appointments}/invoices/${invoiceId}/mark-paid`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...tokenStore.getAuthHeader(),
    },
    body: JSON.stringify({ amount: amount ?? null }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'No pudimos marcar la factura como pagada.');
  }
  return res.json();
}

export async function cancelInvoice(invoiceId) {
  const res = await fetchWithTimeout(`${API.appointments}/invoices/${invoiceId}/cancel`, {
    method: 'POST',
    headers: tokenStore.getAuthHeader(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'No pudimos cancelar la factura.');
  }
  return res.json();
}

export async function initPayUPayment(invoiceId) {
  const res = await fetchWithTimeout(`${API.appointments}/invoices/${invoiceId}/payu/init`, {
    method: 'POST',
    headers: tokenStore.getAuthHeader(),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'No pudimos iniciar el pago con PayU.');
  }
  return res.json(); // { payment_url, fields, gateway_transaction_id }
}
