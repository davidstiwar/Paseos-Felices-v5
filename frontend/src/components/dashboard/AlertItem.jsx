import React from 'react';

/**
 * AlertItem
 * Patrón simple para mensajes en dashboard.
 */
export default function AlertItem({ type = 'info', message, icon, className = '' }) {
  if (!message) return null;
  return (
    <div className={['alert-item', type, className].filter(Boolean).join(' ')}>
      {icon ? <span style={{ marginRight: 8 }}>{icon}</span> : null}
      {message}
    </div>
  );
}

