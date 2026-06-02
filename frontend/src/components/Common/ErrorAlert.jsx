import React from 'react';

/**
 * ErrorAlert
 * Reutiliza el estilo existente: `.error-container`
 */
export default function ErrorAlert({
  message,
  type = 'error', // error | warning | info
  dismissible = true,
  onClose,
  icon,
  className = '',
}) {
  if (!message) return null;

  const canClose = dismissible && typeof onClose === 'function';

  return (
    <div className={`error-container ${className}`.trim()} data-type={type} role="alert">
      <p>
        {icon ? <span style={{ marginRight: 8 }}>{icon}</span> : null}
        {message}
      </p>
      {canClose ? (
        <button
          type="button"
          className="btn btn-secondary btn-small"
          onClick={onClose}
          style={{ marginTop: 8 }}
        >
          Cerrar
        </button>
      ) : null}
    </div>
  );
}

