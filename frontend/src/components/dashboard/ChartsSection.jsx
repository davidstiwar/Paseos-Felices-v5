import React from 'react';
import { calculatePieSegments } from '../../utils/dashboardHelpers';

const ChartsSection = ({ barData, pieData }) => {
  const pieSegments = calculatePieSegments(pieData);

  return (
    <div className="charts-grid">
      {/* Gráfica de Barras */}
      <div className="chart-card">
        <h3>Actividad por servicio</h3>
        <div className="bar-chart">
          {barData.map((item, index) => (
            <div key={index} className="bar-row">
              <span className="bar-label">{item.label}</span>
              <div className="bar-track">
                <div 
                  className="bar-fill" 
                  style={{ 
                    width: `${item.value}%`, 
                    background: 'var(--primary)' // Usamos variable en lugar de color hardcodeado
                  }}
                ></div>
              </div>
              <span className="bar-value">{item.value}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Gráfica de Torta (Donut) */}
      <div className="chart-card">
        <h3>Distribución de servicios</h3>
        <div className="pie-wrapper">
          <div 
            className="pie-chart"
            style={{
              background: `conic-gradient(${pieSegments.map(seg => 
                `var(--primary) ${seg.start}deg ${seg.end}deg` // Simplificado con variable principal
              ).join(', ')})`
            }}
          >
            <div className="pie-center"></div>
          </div>
          <div className="pie-legend">
            {pieData.map((item, index) => (
              <div key={index} className="legend-item">
                <span className="legend-color" style={{ background: 'var(--primary)' }}></span>
                <span>{item.label} ({item.value}%)</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChartsSection;
