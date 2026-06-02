// frontend/src/utils/dashboardHelpers.js
// Funciones de ayuda para el dashboard del cliente.

export const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Buenos días";
  if (hour < 19) return "Buenas tardes";
  return "Buenas noches";
};

export const formatCurrentDate = () => {
  return new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Calcula los segmentos para la gráfica de torta (donut)
export const calculatePieSegments = (pieData) => {
  const total = pieData.reduce((sum, d) => sum + d.value, 0);
  let currentAngle = 0;

  return pieData.map(item => {
    const angle = (item.value / total) * 360;
    const segment = { ...item, start: currentAngle, end: currentAngle + angle };
    currentAngle += angle;
    return segment;
  });
};

// Colores para gráficos (usando variables CSS donde sea posible)
// Por ahora devolvemos los valores para que los componentes los usen con variables
export const getChartColors = () => ({
  primary: 'var(--primary)',
  primaryLight: 'var(--primary-light)',
  accent: '#f4a261', // Mantener por compatibilidad, idealmente mover a CSS
});
