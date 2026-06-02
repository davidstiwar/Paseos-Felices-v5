import React from 'react';

function getBaseClass(variant) {
  switch (variant) {
    case 'secondary':
      return 'btn btn-secondary';
    case 'primary':
    default:
      return 'btn btn-primary';
  }
}

function getSizeClass(size) {
  switch (size) {
    case 'small':
      return 'btn-small';
    case 'large':
      return 'btn-large';
    case 'medium':
    default:
      return '';
  }
}

/**
 * ActionButton
 * Usa las clases existentes: `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-small`, `.btn-large`
 */
export default function ActionButton({
  label,
  variant = 'primary',
  size = 'medium',
  onClick,
  disabled = false,
  loading = false,
  icon,
  fullWidth = false,
  type = 'button',
  className = '',
  ...rest
}) {
  const isDisabled = disabled || loading;
  const base = getBaseClass(variant);
  const sizeClass = getSizeClass(size);

  return (
    <button
      type={type}
      className={[base, sizeClass, fullWidth ? 'btn-full' : '', className].filter(Boolean).join(' ')}
      onClick={onClick}
      disabled={isDisabled}
      {...rest}
    >
      {loading ? (
        <span style={{ marginRight: label ? 8 : 0 }}>...</span>
      ) : icon ? (
        <span style={{ marginRight: label ? 8 : 0 }}>{icon}</span>
      ) : null}
      {label}
    </button>
  );
}

