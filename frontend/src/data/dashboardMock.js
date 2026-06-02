// frontend/src/data/dashboardMock.js
// Datos mock para el dashboard del cliente.
// Cuando se conecte a APIs reales, estos datos se reemplazarán por fetches.

export const mockStats = {
  totalPets: 0, // Se calculará dinámicamente
  nextAppointment: "25 May 2026",
  completedServices: 14,
  pendingAppointments: 2,
};

export const mockNextAppointment = {
  pet: "Max",
  service: "Paseo Premium",
  date: "25 de Mayo 2026",
  time: "10:30 AM",
  price: 35,
  groomer: "Carlos Mendoza",
};

export const mockBarData = [
  { label: "Paseos", value: 78 },
  { label: "Grooming", value: 52 },
  { label: "Entrenamiento", value: 34 },
];

export const mockPieData = [
  { label: "Paseos", value: 55 },
  { label: "Grooming", value: 30 },
  { label: "Entrenamiento", value: 15 },
];

export const mockNotifications = [
  {
    id: 1,
    message: "Tu cita para Max está confirmada para el 25 de Mayo",
    time: "Hace 2h",
    type: "info",
  },
  {
    id: 2,
    message: "Luna completó su paseo de hoy con éxito",
    time: "Ayer",
    type: "success",
  },
  {
    id: 3,
    message: "Recordatorio: grooming programado para Luna el 28",
    time: "Hace 3d",
    type: "warning",
  },
];

export const mockRecentHistory = [
  { id: 1, pet: "Max", service: "Paseo Premium", date: "18 May 2026", status: "Completado" },
  { id: 2, pet: "Luna", service: "Grooming", date: "15 May 2026", status: "Completado" },
  { id: 3, pet: "Max", service: "Paseo Estándar", date: "12 May 2026", status: "Completado" },
  { id: 4, pet: "Luna", service: "Paseo Premium", date: "8 May 2026", status: "Completado" },
];

// Fallback para pets si falla la API
export const mockPets = [
  { _id: '1', name: 'Max', breed: 'Golden Retriever', age: 3 },
  { _id: '2', name: 'Luna', breed: 'Siamés', age: 2 },
];
