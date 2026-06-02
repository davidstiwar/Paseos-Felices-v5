import React from 'react';

function normalizeStatus(status) {
  return String(status || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/_/g, '')
    .replace(/-/g, '');
}

/**
 * StatusBadge
 * Reutiliza estilos existentes: `.status-badge` y variantes por clase / data-status.
 *
 * Nota: la app tiene estados en español e inglés (ej: "pendiente" / "pending").
 * Este componente aplica ambos: className + data-status para maximizar compatibilidad.
 */
export default function StatusBadge({ status, size = 'medium', icon, className = '', children }) {
  const key = normalizeStatus(status);
  const sizeClass = size === 'small' ? 'small' : size === 'large' ? 'large' : '';

  return (
    <span
      className={['status-badge', key, sizeClass, className].filter(Boolean).join(' ')}
      data-status={key || undefined}
    >
      {icon ? <span style={{ marginRight: 6 }}>{icon}</span> : null}
      {children ?? status}
    </span>
  );
}

