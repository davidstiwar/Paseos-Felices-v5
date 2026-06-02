import React, { useState, useEffect } from 'react';
import '../../../estilos/ClientPanel.css';

// Componentes modulares
import WelcomeBanner from '../../../components/dashboard/WelcomeBanner';
import StatsCards from '../../../components/dashboard/StatsCards';
import ChartsSection from '../../../components/dashboard/ChartsSection';
import PetsPreview from '../../../components/dashboard/PetsPreview';

// Helpers
import { getGreeting, formatCurrentDate } from '../../../utils/dashboardHelpers';
import { getMyPets } from '../../../api/pets';
import { getMyAppointments } from '../../../api/appointments';
import { useUser } from '../../../components/Context/UserContext';

const ClientDashboard = () => {
  const [pets, setPets] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useUser();

  const userName = user?.full_name || user?.nombre_completo || user?.email?.split('@')[0] || 'Usuario';

  // Cargar mascotas y citas reales
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [petsData, appointmentsData] = await Promise.all([
          getMyPets(),
          getMyAppointments()
        ]);
        setPets(petsData);
        setAppointments(appointmentsData);
      } catch (err) {
        console.error('Error cargando datos:', err);
        setPets([]);
        setAppointments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Actualizar datos cada 30 segundos
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Datos dinámicos (reales)
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Próxima cita (la más próxima en el futuro)
  const futureAppointments = appointments.filter(a => {
    const apptDate = new Date(a.date);
    return apptDate >= now && a.status !== 'cancelled' && a.status !== 'completed';
  }).sort((a, b) => new Date(a.date) - new Date(b.date));

  const nextAppointment = futureAppointments.length > 0 
    ? `${futureAppointments[0].date} ${futureAppointments[0].time}`
    : "Sin citas agendadas";

  // Servicios completados este mes
  const completedThisMonth = appointments.filter(a => {
    if (a.status !== 'completed') return false;
    const apptDate = new Date(a.date);
    return apptDate.getMonth() === currentMonth && apptDate.getFullYear() === currentYear;
  }).length;

  // Citas pendientes (pending o confirmed)
  const pendingAppointments = appointments.filter(a => 
    a.status === 'pending' || a.status === 'confirmed'
  ).length;

  const stats = {
    totalPets: pets.length,
    nextAppointment,
    completedServices: completedThisMonth,
    pendingAppointments,
  };

  const greeting = getGreeting();
  const currentDate = formatCurrentDate();

  // Datos para gráficas
  // Actividad por servicio (citas por tipo de servicio)
  const serviceCounts = {};
  appointments.forEach(a => {
    if (a.status === 'completed') {
      serviceCounts[a.service] = (serviceCounts[a.service] || 0) + 1;
    }
  });

  const totalCompleted = Object.values(serviceCounts).reduce((sum, count) => sum + count, 0);
  const barData = Object.entries(serviceCounts).map(([service, count]) => ({
    label: service,
    value: totalCompleted > 0 ? Math.round((count / totalCompleted) * 100) : 0
  }));

  // Distribución de servicios (misma data pero en formato para pie chart)
  const pieData = Object.entries(serviceCounts).map(([service, count]) => ({
    label: service,
    value: totalCompleted > 0 ? Math.round((count / totalCompleted) * 100) : 0
  }));

  // Próximas citas (no canceladas ni completadas)
  const upcomingAppointments = futureAppointments.slice(0, 3);

  return (
    <div className="client-dashboard">
      {/* 1. Bienvenida */}
      <WelcomeBanner 
        userName={userName} 
        greeting={greeting} 
        currentDate={currentDate} 
      />

      {/* 2. Tarjetas de estadísticas */}
      <div className="dashboard-section">
        <StatsCards stats={stats} />
      </div>

      {/* 3. Gráficas (datos reales) */}
      <div className="dashboard-section">
        <h2>Estadísticas</h2>
        {totalCompleted > 0 ? (
          <ChartsSection barData={barData} pieData={pieData} />
        ) : (
          <p style={{ color: '#888', fontStyle: 'italic' }}>
            Las gráficas se mostrarán cuando tengas servicios completados.
          </p>
        )}
      </div>

      {/* 4. Próximas Citas (reales) */}
      <div className="dashboard-section">
        <h2>Próximas Citas</h2>
        {upcomingAppointments.length === 0 ? (
          <p style={{ color: '#666' }}>
            No tienes próximas citas agendadas.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {upcomingAppointments.map((appt) => (
              <div 
                key={appt.id} 
                style={{
                  padding: '16px',
                  background: 'var(--bg-card, #f8f9fa)',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color, #e5e7eb)'
                }}
              >
                <div style={{ fontWeight: '600', fontSize: '16px' }}>
                  {appt.service}
                </div>
                <div style={{ marginTop: '8px', color: 'var(--text-secondary, #666)' }}>
                  {appt.date} • {appt.time}
                </div>
                <div style={{ marginTop: '4px' }}>
                  <span style={{
                    background: appt.status === 'confirmed' ? '#22c55e' : '#f59e0b',
                    color: 'white',
                    padding: '2px 10px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}>
                    {appt.status === 'confirmed' ? 'Confirmada' : 'Pendiente'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. Vista previa de Mascotas (real) */}
      <div className="dashboard-section">
        <h2>Mascotas</h2>
        <PetsPreview pets={pets} loading={loading} />
      </div>

      {/* 6. Historial (placeholder) */}
      <div className="dashboard-section">
        <h2>Historial reciente</h2>
        <p style={{ color: '#888', fontStyle: 'italic' }}>
          El historial se mostrará cuando conectemos el servicio de citas.
        </p>
      </div>
    </div>
  );
};

export default ClientDashboard;
