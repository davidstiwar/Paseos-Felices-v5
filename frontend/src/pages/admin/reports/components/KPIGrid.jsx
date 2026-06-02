// components/KPIGrid.jsx
import React from 'react';

const KPIGrid = ({ kpis }) => {
  return (
    <div className="main-stats-grid">
      {Object.entries(kpis).map(([key, value]) => (
        <div className="stat-card" key={key}>
          <div className="stat-content">
            <h3>{key}</h3>
            <p className="stat-number">{typeof value === 'number' ? value.toLocaleString() : value}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default KPIGrid;
