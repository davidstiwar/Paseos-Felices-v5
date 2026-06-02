// components/ReportFilters.jsx
import React from 'react';

const ReportFilters = ({ activeFilter, onFilterChange }) => {
  const filters = ['Hoy', 'Esta semana', 'Este mes', 'Este año', 'Rango personalizado'];

  return (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      {filters.map(filter => (
        <button
          key={filter}
          onClick={() => onFilterChange(filter)}
          className={`filter-btn ${activeFilter === filter ? 'active' : ''}`}
        >
          {filter}
        </button>
      ))}
    </div>
  );
};

export default ReportFilters;
