import React from 'react';

const sizeToTextStyle = {
  small: { fontSize: '0.9rem' },
  medium: { fontSize: '1rem' },
  large: { fontSize: '1.1rem' },
};

/**
 * LoadingSpinner
 * Reutiliza el estilo existente: `.loading-container`
 */
export default function LoadingSpinner({
  size = 'medium',
  message = 'Cargando...',
  fullScreen = false,
  className = '',
  style,
}) {
  const containerStyle = fullScreen
    ? {
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.25)',
        ...style,
      }
    : style;

  return (
    <div
      className={`loading-container ${className}`.trim()}
      style={containerStyle}
      role="status"
      aria-live="polite"
    >
      {message ? <p style={sizeToTextStyle[size] || sizeToTextStyle.medium}>{message}</p> : null}
    </div>
  );
}

