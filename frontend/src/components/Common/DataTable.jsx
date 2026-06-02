import React, { useState } from 'react';

/**
 * DataTable - Componente de tabla de datos reutilizable
 * Soporta sorting, paginación, y acciones personalizadas
 */
export default function DataTable({
  columns,
  data,
  loading = false,
  sortBy,
  sortOrder = 'asc',
  onSort,
  rowsPerPage = 10,
  actions,
  striped = true,
  bordered = false,
  emptyMessage = 'No hay datos disponibles',
  className = '',
}) {
  const [currentPage, setCurrentPage] = useState(0);
  const [internalSortBy, setInternalSortBy] = useState(sortBy);
  const [internalSortOrder, setInternalSortOrder] = useState(sortOrder);

  const effectiveSortBy = sortBy || internalSortBy;
  const effectiveSortOrder = sortOrder || internalSortOrder;

  // Handle sorting
  const handleSort = (columnKey) => {
    const newOrder = effectiveSortBy === columnKey && effectiveSortOrder === 'asc' ? 'desc' : 'asc';
    
    if (onSort) {
      onSort(columnKey, newOrder);
    } else {
      setInternalSortBy(columnKey);
      setInternalSortOrder(newOrder);
    }
  };

  // Sort data
  const sortedData = [...data].sort((a, b) => {
    if (!effectiveSortBy) return 0;
    
    const aValue = a[effectiveSortBy];
    const bValue = b[effectiveSortBy];
    
    if (aValue === bValue) return 0;
    
    const comparison = aValue < bValue ? -1 : 1;
    return effectiveSortOrder === 'asc' ? comparison : -comparison;
  });

  // Pagination
  const totalPages = Math.ceil(sortedData.length / rowsPerPage);
  const startIndex = currentPage * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedData = sortedData.slice(startIndex, endIndex);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const tableClass = [
    'data-table',
    striped ? 'data-table-striped' : '',
    bordered ? 'data-table-bordered' : '',
    className
  ].filter(Boolean).join(' ');

  if (loading) {
    return (
      <div className="data-table-loading">
        <p>Cargando datos...</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="data-table-empty">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="data-table-container">
      <table className={tableClass}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                onClick={column.sortable !== false ? () => handleSort(column.key) : undefined}
                style={{
                  cursor: column.sortable !== false ? 'pointer' : 'default',
                  width: column.width || 'auto',
                }}
              >
                <div className="table-header-content">
                  {column.label}
                  {column.sortable !== false && effectiveSortBy === column.key && (
                    <span className="sort-indicator">
                      {effectiveSortOrder === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
            ))}
            {actions && actions.length > 0 && <th className="actions-column">Acciones</th>}
          </tr>
        </thead>
        <tbody>
          {paginatedData.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {columns.map((column) => (
                <td key={column.key}>
                  {column.render ? column.render(row[column.key], row, rowIndex) : row[column.key]}
                </td>
              ))}
              {actions && actions.length > 0 && (
                <td className="actions-column">
                  <div className="table-actions">
                    {actions.map((action, actionIndex) => (
                      <button
                        key={actionIndex}
                        className={`btn btn-${action.variant || 'secondary'} btn-small`}
                        onClick={() => action.onClick(row, rowIndex)}
                        disabled={action.disabled}
                        title={action.label}
                      >
                        {action.icon || action.label}
                      </button>
                    ))}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {totalPages > 1 && (
        <div className="data-table-pagination">
          <button
            className="btn btn-secondary btn-small"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 0}
          >
            ← Anterior
          </button>
          
          <span className="pagination-info">
            Página {currentPage + 1} de {totalPages}
          </span>
          
          <button
            className="btn btn-secondary btn-small"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages - 1}
          >
            Siguiente →
          </button>
        </div>
      )}
    </div>
  );
}
