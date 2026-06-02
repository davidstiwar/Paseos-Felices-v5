import React, { useEffect } from 'react';

/**
 * ModalDialog
 * Reutiliza estilos existentes: `.modal-overlay`, `.modal`, `.modal-close`
 */
export default function ModalDialog({
  isOpen,
  onClose,
  title,
  size = 'medium', // small | medium | large
  actions,
  closeButton = true,
  backdrop = true, // true | false | 'static'
  children,
}) {
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = e => {
      if (e.key === 'Escape') {
        if (backdrop === 'static') return;
        onClose?.();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose, backdrop]);

  if (!isOpen) return null;

  const modalClass = ['modal', size === 'large' ? 'large' : ''].filter(Boolean).join(' ');

  const handleBackdropClick = () => {
    if (!backdrop) return;
    if (backdrop === 'static') return;
    onClose?.();
  };

  return (
    <div className="modal-overlay" onClick={handleBackdropClick} role="dialog" aria-modal="true">
      <div className={modalClass} onClick={e => e.stopPropagation()}>
        {closeButton ? (
          <button type="button" className="modal-close" onClick={onClose} aria-label="Cerrar modal">
            ×
          </button>
        ) : null}

        {title ? <h3>{title}</h3> : null}

        <div className="modal-body">{children}</div>

        {Array.isArray(actions) && actions.length > 0 ? (
          <div className="modal-footer">
            {actions.map((a, idx) => (
              <button
                key={idx}
                type="button"
                className={a.variant ? `btn btn-${a.variant}` : 'btn btn-secondary'}
                onClick={a.onClick}
                disabled={a.disabled}
              >
                {a.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

