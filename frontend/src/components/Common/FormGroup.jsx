import React from 'react';

/**
 * FormGroup
 * Reutiliza estilos existentes: `.form-group`
 */
export default function FormGroup({
  label,
  name,
  type = 'text',
  value,
  onChange,
  error,
  required = false,
  placeholder,
  disabled = false,
  options, // para select: [{ value, label }]
  as, // 'input' | 'select' | 'textarea' (opcional)
  rows = 3,
  className = '',
  ...rest
}) {
  const controlType = as || (type === 'select' ? 'select' : type === 'textarea' ? 'textarea' : 'input');

  const commonProps = {
    name,
    value: value ?? '',
    onChange,
    placeholder,
    disabled,
    'aria-invalid': Boolean(error) || undefined,
    ...rest,
  };

  return (
    <div className={`form-group ${className}`.trim()}>
      {label ? (
        <label htmlFor={name}>
          {label}
          {required ? <span style={{ color: 'var(--danger, #ff4d4f)' }}> *</span> : null}
        </label>
      ) : null}

      {controlType === 'select' ? (
        <select id={name} {...commonProps}>
          {(options || []).map(opt => (
            <option key={String(opt.value)} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : controlType === 'textarea' ? (
        <textarea id={name} rows={rows} {...commonProps} />
      ) : (
        <input id={name} type={type} {...commonProps} />
      )}

      {error ? (
        <small style={{ color: 'var(--danger, #ff4d4f)', marginTop: 6, display: 'block' }}>{error}</small>
      ) : null}
    </div>
  );
}

