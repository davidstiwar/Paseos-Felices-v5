import React from 'react';
import { StatusBadge } from '../Common';

function formatDate(date) {
  try {
    return new Date(date).toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return String(date || '');
  }
}

/**
 * AppointmentCard (unificado)
 */
export default function AppointmentCard({ appointment, onClick, actions, className = '' }) {
  if (!appointment) return null;

  return (
    <div className={['appointment-card', className].filter(Boolean).join(' ')} onClick={onClick}>
      <div className="appointment-header">
        <h3>{appointment.petName || 'Cita'}</h3>
        <StatusBadge status={appointment.status} size="small" />
      </div>

      <div className="appointment-details">
        {appointment.service ? (
          <p>
            <strong>Servicio:</strong> {appointment.service}
          </p>
        ) : null}
        {appointment.date ? (
          <p>
            <strong>Fecha:</strong> {formatDate(appointment.date)}
          </p>
        ) : null}
        {appointment.time ? (
          <p>
            <strong>Hora:</strong> {appointment.time}
          </p>
        ) : null}
        {appointment.groomerName ? (
          <p>
            <strong>Groomer:</strong> {appointment.groomerName}
          </p>
        ) : null}
      </div>

      {Array.isArray(actions) && actions.length > 0 ? (
        <div className="appointment-actions" onClick={e => e.stopPropagation()}>
          {actions.map((a, idx) => (
            <button
              key={idx}
              type="button"
              className={a.className || `btn ${a.variant ? `btn-${a.variant}` : 'btn-secondary'}`}
              onClick={() => a.onClick?.(appointment)}
              disabled={a.disabled}
            >
              {a.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

