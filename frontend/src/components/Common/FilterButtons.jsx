import React from 'react';

/**
 * FilterButtons
 * Reutiliza estilos existentes: `.filter-btn` (+ `.active`)
 */
export default function FilterButtons({
  options,
  value,
  onChange,
  variant = 'pills', // pills | tabs | underline (por ahora solo usa clases actuales)
  multiple = false,
  disabled = false,
  className = '',
}) {
  if (!Array.isArray(options) || options.length === 0) return null;

  const isActive = id => (multiple ? Array.isArray(value) && value.includes(id) : value === id);

  const handleClick = id => {
    if (disabled) return;
    if (multiple) {
      const current = Array.isArray(value) ? value : [];
      const next = current.includes(id) ? current.filter(x => x !== id) : [...current, id];
      onChange?.(next);
    } else {
      onChange?.(id);
    }
  };

  return (
    <div className={className} data-variant={variant}>
      {options.map(opt => (
        <button
          key={opt.id}
          type="button"
          className={`filter-btn ${isActive(opt.id) ? 'active' : ''}`.trim()}
          onClick={() => handleClick(opt.id)}
          disabled={disabled}
        >
          {opt.label}
          {typeof opt.count === 'number' ? <span style={{ marginLeft: 6 }}>({opt.count})</span> : null}
        </button>
      ))}
    </div>
  );
}

