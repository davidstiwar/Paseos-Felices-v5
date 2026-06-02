// components/ServicesChart.jsx
import React from 'react';
import { Bar } from 'react-chartjs-2';

const ServicesChart = ({ data }) => {
  return (
    <div className="chart-card">
      <h3>Servicios más vendidos</h3>
      <Bar data={data} options={{ responsive: true, plugins: { legend: { display: false } } }} />
    </div>
  );
};

export default ServicesChart;
