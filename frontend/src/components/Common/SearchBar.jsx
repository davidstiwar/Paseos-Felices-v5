import React, { useEffect, useMemo, useState } from 'react';

/**
 * SearchBar
 * Reutiliza estilos existentes: `.search-box`
 */
export default function SearchBar({
  value,
  onChange,
  placeholder = 'Buscar...',
  onSearch,
  debounce = 300,
  icon = '🔍',
  clearable = true,
  className = '',
}) {
  const [internal, setInternal] = useState(value ?? '');

  useEffect(() => {
    setInternal(value ?? '');
  }, [value]);

  const debouncedSearch = useMemo(() => {
    if (typeof onSearch !== 'function') return null;
    let t;
    return v => {
      clearTimeout(t);
      t = setTimeout(() => onSearch(v), debounce);
    };
  }, [onSearch, debounce]);

  const handleChange = e => {
    const v = e.target.value;
    setInternal(v);
    onChange?.(v);
    debouncedSearch?.(v);
  };

  const handleClear = () => {
    setInternal('');
    onChange?.('');
    debouncedSearch?.('');
  };

  return (
    <div className={`search-box ${className}`.trim()}>
      <input placeholder={placeholder} value={internal} onChange={handleChange} />
      <span className="search-icon">{icon}</span>
      {clearable && internal ? (
        <button type="button" className="btn btn-secondary btn-small" onClick={handleClear}>
          Limpiar
        </button>
      ) : null}
    </div>
  );
}

