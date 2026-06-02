import React from 'react';

function formatDate(date) {
  try {
    return new Date(date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return String(date || '');
  }
}

function renderStars(rating) {
  if (rating === 0) return 'Sin calificar';
  if (!rating && rating !== 0) return '';
  return '⭐'.repeat(Math.round(rating));
}

/**
 * ServiceCard (unificado)
 */
export default function ServiceCard({
  service,
  onView,
  onEdit,
  onDelete,
  showRating = true,
  className = '',
}) {
  if (!service) return null;

  return (
    <div className={['service-card', className].filter(Boolean).join(' ')}>
      <div className="service-header">
        <h4>{service.petName || service.pet || 'Servicio'}</h4>
        {service.service ? <span className="service-type">{service.service}</span> : null}
      </div>

      <div className="service-details">
        {service.groomerName ? (
          <p>
            <strong>Groomer:</strong> {service.groomerName}
          </p>
        ) : null}
        {service.date ? (
          <p>
            <strong>Fecha:</strong> {formatDate(service.date)}
          </p>
        ) : null}
        {showRating && typeof service.rating !== 'undefined' ? (
          <p>
            <strong>Calificación:</strong> {renderStars(service.rating)} {service.rating ? `(${service.rating}/5)` : ''}
          </p>
        ) : null}
        {service.notes ? (
          <p>
            <strong>Notas:</strong> {service.notes}
          </p>
        ) : null}
      </div>

      {(onView || onEdit || onDelete) && (
        <div className="service-actions">
          {onView ? (
            <button className="btn-secondary action-btn" type="button" onClick={() => onView(service)}>
              Ver
            </button>
          ) : null}
          {onEdit ? (
            <button className="btn-secondary action-btn" type="button" onClick={() => onEdit(service)}>
              Editar
            </button>
          ) : null}
          {onDelete ? (
            <button className="btn-primary action-btn" type="button" onClick={() => onDelete(service)}>
              Eliminar
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}

