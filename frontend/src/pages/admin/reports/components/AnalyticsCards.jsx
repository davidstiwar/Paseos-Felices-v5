// components/AnalyticsCards.jsx
import React from 'react';

const AnalyticsCards = () => {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
      <div className="chart-card">
        <h3>Ingresos por Groomer</h3>
        <p style={{ marginTop: '12px', color: '#888' }}>Componente en desarrollo...</p>
      </div>
      <div className="chart-card">
        <h3>Clientes más activos</h3>
        <p style={{ marginTop: '12px', color: '#888' }}>Componente en desarrollo...</p>
      </div>
    </div>
  );
};

export default AnalyticsCards;
