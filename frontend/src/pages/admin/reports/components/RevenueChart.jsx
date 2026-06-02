// components/RevenueChart.jsx
import React from 'react';
import { Line } from 'react-chartjs-2';

const RevenueChart = ({ data }) => {
  return (
    <div className="chart-card">
      <h3>Ingresos mensuales</h3>
      <Line data={data} options={{ responsive: true, plugins: { legend: { display: false } } }} />
    </div>
  );
};

export default RevenueChart;
