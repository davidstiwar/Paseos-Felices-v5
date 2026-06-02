import { API, fetchWithTimeout } from './config';
import { tokenStore } from './tokenStore';

function formatDetail(detail) {
  if (!detail) return null;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    // Validaciones pydantic suelen venir como lista de objetos
    return detail.map((d) => d?.msg || JSON.stringify(d)).join(' | ');
  }
  if (typeof detail === 'object') return JSON.stringify(detail);
  return String(detail);
}

export async function createReview({ groomer_id, appointment_id, rating, comment }) {
  const res = await fetchWithTimeout(`${API.reviews}/reviews/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...tokenStore.getAuthHeader(),
    },
    body: JSON.stringify({ groomer_id, appointment_id, rating, comment }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = formatDetail(err.detail) || 'No pudimos guardar tu reseña. Por favor, intenta nuevamente.';
    const e = new Error(msg);
    e.status = res.status;
    e.raw = err;
    throw e;
  }
  return res.json();
}

export async function updateReview(reviewId, { rating, comment }) {
  const res = await fetchWithTimeout(`${API.reviews}/reviews/${reviewId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...tokenStore.getAuthHeader(),
    },
    body: JSON.stringify({ rating, comment }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = formatDetail(err.detail) || 'No pudimos actualizar tu reseña. Por favor, intenta nuevamente.';
    const e = new Error(msg);
    e.status = res.status;
    e.raw = err;
    throw e;
  }
  return res.json();
}

export async function getMyReviews() {
  const res = await fetchWithTimeout(`${API.reviews}/reviews/me`, {
    headers: tokenStore.getAuthHeader(),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = formatDetail(err.detail) || 'No pudimos cargar tus reseñas. Por favor, intenta nuevamente.';
    const e = new Error(msg);
    e.status = res.status;
    e.raw = err;
    throw e;
  }
  return res.json();
}

export async function getReviewByAppointment(appointmentId) {
  const res = await fetchWithTimeout(`${API.reviews}/reviews/appointment/${appointmentId}`, {
    headers: tokenStore.getAuthHeader(),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = formatDetail(err.detail) || 'No pudimos cargar la reseña de esa cita.';
    const e = new Error(msg);
    e.status = res.status;
    e.raw = err;
    throw e;
  }

  return res.json();
}

export async function getReviewsByGroomer(groomerId) {
  const res = await fetchWithTimeout(`${API.reviews}/reviews/groomer/${groomerId}`);

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = formatDetail(err.detail) || 'No pudimos cargar las reseñas del groomer.';
    const e = new Error(msg);
    e.status = res.status;
    e.raw = err;
    throw e;
  }
  return res.json();
}

export async function getAllReviewsPublic(limit = 10) {
  const res = await fetchWithTimeout(`${API.reviews}/reviews/public/all?limit=${limit}`);

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = formatDetail(err.detail) || 'No pudimos cargar las reseñas. Por favor, intenta nuevamente.';
    const e = new Error(msg);
    e.status = res.status;
    e.raw = err;
    throw e;
  }
  return res.json();
}
