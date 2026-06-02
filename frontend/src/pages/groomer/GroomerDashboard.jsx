import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../../estilos/GroomerDashboard.css';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend } from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';
import { getGroomerAppointments } from '../../api/appointments';
import { getGroomerProfile } from '../../api/groomer';
import { getGroomerInvoices } from '../../api/invoices';
import { useUser } from '../../components/Context/UserContext';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend);


const GroomerDashboard = () => {
  const [appointments, setAppointments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [groomerProfile, setGroomerProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useUser();

  // Cargar datos del groomer y citas
  useEffect(() => {
    const loadData = async () => {
      try {
        const [profileData, groomerAppointments] = await Promise.all([
          getGroomerProfile(),
          getGroomerAppointments()
        ]);
        
        setGroomerProfile(profileData);
        setAppointments(groomerAppointments);

        // Facturas asociadas (para ingresos y estado de pagos)
        try {
          const inv = await getGroomerInvoices();
          setInvoices(inv || []);
        } catch {
          setInvoices([]);
        }
      } catch (err) {
        console.error('Error cargando datos:', err);
        setAppointments([]);
        setInvoices([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();

    // Actualizar datos cada 30 segundos
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [user]);

// Calcular estadísticas reales
   const statsByStatus = {
    completed: appointments.filter(a => a.status === 'completed').length,
    inProgress: appointments.filter(a => a.status === 'in_progress').length,
    pending: appointments.filter(a => a.status === 'pending').length,
    confirmed: appointments.filter(a => a.status === 'confirmed').length,
    cancelled: appointments.filter(a => a.status === 'cancelled').length,
  };

  const totalAppointments = appointments.length;
  const statusPercentages = totalAppointments > 0 
    ? {
        completed: Math.round((statsByStatus.completed / totalAppointments) * 100),
        inProgress: Math.round((statsByStatus.inProgress / totalAppointments) * 100),
        pending: Math.round((statsByStatus.pending / totalAppointments) * 100),
        confirmed: Math.round((statsByStatus.confirmed / totalAppointments) * 100),
        cancelled: Math.round((statsByStatus.cancelled / totalAppointments) * 100),
      }
    : { completed: 0, inProgress: 0, pending: 0, confirmed: 0, cancelled: 0 };

  // Ingresos por tipo de servicio
  const incomeByService = {};
  // Para monetización, usamos las facturas (total y parte del groomer) en vez del estado "completed".
  invoices.forEach(inv => {
    if (inv.status !== 'cancelled') {
      const key = inv.service_name || 'Servicio';
      incomeByService[key] = (incomeByService[key] || 0) + Number(inv.groomer_amount || 0);
    }
  });

  const totalIncome = Object.values(incomeByService).reduce((sum, val) => sum + val, 0);
  const serviceLabels = Object.keys(incomeByService);
  const serviceIncomes = Object.values(incomeByService);
  const servicePercentages = totalIncome > 0 
    ? serviceIncomes.map(inc => Math.round((inc / totalIncome) * 100))
    : serviceIncomes.map(() => 0);

  // Top clientes - usar nombres en lugar de correos
  const clientVisits = {};
  appointments.forEach(appt => {
    const clientKey = appt.client_name || appt.client_email;
    if (clientKey) {
      clientVisits[clientKey] = (clientVisits[clientKey] || 0) + 1;
    }
  });

  const topClients = Object.entries(clientVisits)
    .map(([name, visits]) => ({ name, visits }))
    .sort((a, b) => b.visits - a.visits)
    .slice(0, 4);

  const clientTotals = {};
  appointments.forEach(appt => {
    const clientKey = appt.client_name || appt.client_email;
    if (clientKey && appt.status === 'completed' && appt.price) {
      clientTotals[clientKey] = (clientTotals[clientKey] || 0) + parseFloat(appt.price);
    }
  });

  // Top mascotas - calcular visitas por mascota
  const petVisits = {};
  appointments.forEach(appt => {
    const petKey = appt.pet_name || `Pet #${appt.pet_id}`;
    const ownerKey = appt.client_name || appt.client_email;
    if (petKey) {
      if (!petVisits[petKey]) {
        petVisits[petKey] = { visits: 0, owner: ownerKey || '-' };
      }
      petVisits[petKey].visits += 1;
    }
  });

  const topPets = Object.entries(petVisits)
    .map(([name, data]) => ({ name, visits: data.visits, owner: data.owner }))
    .sort((a, b) => b.visits - a.visits)
    .slice(0, 4);

  // Lee los colores de los gráficos desde CSS (solución centralizada)
  const getChartColors = () => {
    const root = document.querySelector('.groomer-dashboard') || document.documentElement;
    const style = getComputedStyle(root);

    return {
      primary: style.getPropertyValue('--chart-primary').trim() || '#d96c5f',
      primaryLight: style.getPropertyValue('--chart-primary-light').trim() || '#e8907f',
      success: style.getPropertyValue('--chart-success').trim() || '#22c55e',
      warning: style.getPropertyValue('--chart-warning').trim() || '#f59e0b',
      purple: style.getPropertyValue('--chart-purple').trim() || '#8b5cf6',
      teal: style.getPropertyValue('--chart-teal').trim() || '#14b8a6',
      lineBg: style.getPropertyValue('--chart-line-bg').trim() || 'rgba(217, 108, 95, 0.12)',
      grid: style.getPropertyValue('--chart-grid').trim() || 'rgba(0,0,0,0.08)',
    };
  };

  const colors = getChartColors();

  // Datos de los gráficos usando las variables de color y datos reales
  const lineData = {
    labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
    datasets: [{
      label: 'Servicios Completados',
      data: [statsByStatus.completed, statsByStatus.completed, statsByStatus.completed, statsByStatus.completed, statsByStatus.completed, statsByStatus.completed, statsByStatus.completed],
      borderColor: colors.primary,
      backgroundColor: colors.lineBg,
      tension: 0.4,
      fill: true,
      borderWidth: 3,
    }]
  };

  const barData = {
    labels: serviceLabels.length > 0 ? serviceLabels : ['Sin datos'],
    datasets: [{
      label: 'Ingresos ($)',
      data: serviceIncomes.length > 0 ? serviceIncomes : [0],
      backgroundColor: serviceLabels.length > 0 
        ? [colors.primary, colors.primaryLight, '#c55a4d', colors.warning, colors.success].slice(0, serviceLabels.length)
        : [colors.primary],
    }]
  };

  const pieData = {
    labels: ['Completado', 'En Progreso', 'Pendiente', 'Confirmado'],
    datasets: [{
      data: [statsByStatus.completed, statsByStatus.inProgress, statsByStatus.pending, statsByStatus.confirmed],
      backgroundColor: [colors.success, colors.teal, colors.warning, colors.purple],
    }]
  };

  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { 
      legend: { display: false },
      tooltip: {
        backgroundColor: '#111',
        titleColor: '#fff',
        bodyColor: '#fff',
      }
    },
    scales: {
      x: { grid: { color: colors.grid } },
      y: { grid: { color: colors.grid } }
    }
  };

  if (loading) {
    return (
      <div className="groomer-dashboard">
        <div className="welcome-section">
          <h1>¡Bienvenido, Groomer! 👋</h1>
          <p>Cargando tus datos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="groomer-dashboard">
      {/* Welcome Section */}
      <div className="welcome-section">
        <h1>¡Bienvenido, Groomer! 👋</h1>
        <p>Aquí está el resumen de tu día de hoy</p>
      </div>

      {/* Resumen de facturación */}
      <div style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
        <div style={{ background: 'var(--bg-card, #f8f9fa)', borderRadius: '12px', border: '1px solid var(--border-color, #e5e7eb)', padding: '16px' }}>
          <div style={{ color: '#666' }}>Facturas pendientes</div>
          <div style={{ fontSize: '22px', fontWeight: 900 }}>{invoices.filter(i => i.status === 'pending').length}</div>
        </div>
        <div style={{ background: 'var(--bg-card, #f8f9fa)', borderRadius: '12px', border: '1px solid var(--border-color, #e5e7eb)', padding: '16px' }}>
          <div style={{ color: '#666' }}>Facturas pagadas</div>
          <div style={{ fontSize: '22px', fontWeight: 900 }}>{invoices.filter(i => i.status === 'paid').length}</div>
        </div>
        <div style={{ background: 'var(--bg-card, #f8f9fa)', borderRadius: '12px', border: '1px solid var(--border-color, #e5e7eb)', padding: '16px' }}>
          <div style={{ color: '#666' }}>Ingreso acumulado (pagado)</div>
          <div style={{ fontSize: '22px', fontWeight: 900 }}>
            ${invoices.filter(i => i.status === 'paid').reduce((s, i) => s + Number(i.groomer_amount || 0), 0).toFixed(2)}
          </div>
        </div>
        <div style={{ background: 'var(--bg-card, #f8f9fa)', borderRadius: '12px', border: '1px solid var(--border-color, #e5e7eb)', padding: '16px' }}>
          <div style={{ color: '#666' }}>Ingreso estimado (no canceladas)</div>
          <div style={{ fontSize: '22px', fontWeight: 900 }}>
            ${invoices.filter(i => i.status !== 'cancelled').reduce((s, i) => s + Number(i.groomer_amount || 0), 0).toFixed(2)}
          </div>
        </div>
      </div>

      {/* Servicios que ofrece el groomer */}
      {groomerProfile && groomerProfile.services && groomerProfile.services.length > 0 && (
        <div style={{ marginTop: '20px', padding: '20px', background: 'var(--bg-card, #f8f9fa)', borderRadius: '12px', border: '1px solid var(--border-color, #e5e7eb)' }}>
          <h3 style={{ marginBottom: '15px' }}>📋 Servicios que ofrezco</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '15px' }}>
            {groomerProfile.services.map((service, index) => (
              <div key={index} style={{
                background: 'white',
                padding: '15px',
                borderRadius: '8px',
                border: '1px solid var(--border-color, #e5e7eb)',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
              }}>
                <h4 style={{ margin: '0 0 8px 0', color: 'var(--primary, #d96c5f)' }}>{service.name}</h4>
                <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#666' }}>
                  {service.description || 'Sin descripción'}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#888' }}>
                  <span>{service.category}</span>
                  <span>${service.base_price}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* GRÁFICOS - Primeros en la página principal */}
      <div className="charts-section">
        <h2 className="charts-title">📈 Estadísticas Visuales</h2>
        
        <div className="charts-grid">
          {/* 1. Gráfico de Líneas */}
          <div className="chart-card">
            <h3>Servicios por Día (Última Semana)</h3>
            <div className="chart-wrapper">
              <Line 
                data={lineData} 
                options={commonOptions} 
              />
            </div>
          </div>

          {/* 2. Gráfica de Barras */}
          <div className="chart-card">
            <h3>Ingresos por Tipo de Servicio</h3>
            <div className="chart-wrapper">
              <Bar 
                data={barData} 
                options={commonOptions} 
              />
            </div>
          </div>

          {/* 3. Gráfico de Sector (Pie) */}
          <div className="chart-card">
            <h3>Distribución de Estados</h3>
            <div className="chart-wrapper">
              <Pie 
                data={pieData} 
                options={{ 
                  responsive: true, 
                  maintainAspectRatio: false,
                  plugins: { legend: { display: true, position: 'bottom' } }
                }} 
              />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid eliminado por solicitud del usuario */}

      {/* 4 Estadísticas de Tablas Variadas */}
      <div className="stats-tables-grid">
        
        {/* 1. Servicios por Estado */}
        <div className="stat-table">
          <div className="stat-table-header">
            <h3>📊 Servicios por Estado</h3>
          </div>
          <table className="mini-table">
            <thead>
              <tr>
                <th>Estado</th>
                <th>Cant.</th>
                <th>%</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>Completados</td><td>{statsByStatus.completed}</td><td>{statusPercentages.completed}%</td></tr>
              <tr><td>En Progreso</td><td>{statsByStatus.inProgress}</td><td>{statusPercentages.inProgress}%</td></tr>
              <tr><td>Pendientes</td><td>{statsByStatus.pending}</td><td>{statusPercentages.pending}%</td></tr>
              <tr><td>Confirmados</td><td>{statsByStatus.confirmed}</td><td>{statusPercentages.confirmed}%</td></tr>
              <tr><td>Cancelados</td><td>{statsByStatus.cancelled}</td><td>{statusPercentages.cancelled}%</td></tr>
            </tbody>
          </table>
        </div>

        {/* 2. Ingresos por Tipo de Servicio */}
        <div className="stat-table">
          <div className="stat-table-header">
            <h3>💰 Ingresos por Tipo</h3>
          </div>
          <table className="mini-table">
            <thead>
              <tr>
                <th>Servicio</th>
                <th>Ingresos</th>
                <th>%</th>
              </tr>
            </thead>
            <tbody>
              {serviceLabels.length > 0 ? (
                serviceLabels.map((label, index) => (
                  <tr key={index}>
                    <td>{label}</td>
                    <td>${serviceIncomes[index].toFixed(2)}</td>
                    <td>{servicePercentages[index]}%</td>
                  </tr>
                ))
              ) : (
                <tr><td>-</td><td>$0</td><td>0%</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 3. Top Clientes */}
        <div className="stat-table">
          <div className="stat-table-header">
            <h3>👤 Top Clientes</h3>
          </div>
          <table className="mini-table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Visitas</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {topClients.length > 0 ? (
                topClients.map((client, index) => (
                  <tr key={index}>
                    <td>{client.name}</td>
                    <td>{client.visits}</td>
                    <td>${(clientTotals[client.name] || 0).toFixed(2)}</td>
                  </tr>
                ))
              ) : (
                <>
                  <tr><td>-</td><td>0</td><td>$0</td></tr>
                  <tr><td>-</td><td>0</td><td>$0</td></tr>
                  <tr><td>-</td><td>0</td><td>$0</td></tr>
                  <tr><td>-</td><td>0</td><td>$0</td></tr>
                </>
              )}
            </tbody>
          </table>
        </div>

        {/* 4. Mascotas Más Atendidas */}
        <div className="stat-table">
          <div className="stat-table-header">
            <h3>🐾 Mascotas Top</h3>
          </div>
          <table className="mini-table">
            <thead>
              <tr>
                <th>Mascota</th>
                <th>Visitas</th>
                <th>Dueño</th>
              </tr>
            </thead>
            <tbody>
              {topPets.length > 0 ? (
                topPets.map((pet, index) => (
                  <tr key={index}>
                    <td>{pet.name}</td>
                    <td>{pet.visits}</td>
                    <td>{pet.owner}</td>
                  </tr>
                ))
              ) : (
                <>
                  <tr><td>-</td><td>0</td><td>-</td></tr>
                  <tr><td>-</td><td>0</td><td>-</td></tr>
                  <tr><td>-</td><td>0</td><td>-</td></tr>
                  <tr><td>-</td><td>0</td><td>-</td></tr>
                </>
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h3>Acciones Rápidas</h3>
        <div className="actions-grid">
          <Link to="/groomer/services" className="action-btn action-primary">
            <span>📅</span>
            <span>Ver Agenda</span>
          </Link>
          <Link to="/groomer/profile" className="action-btn action-secondary">
            <span>👤</span>
            <span>Mi Perfil</span>
          </Link>
          <Link to="/groomer/statistics" className="action-btn action-info">
            <span>📈</span>
            <span>Estadísticas</span>
          </Link>
          <button className="action-btn action-warning">
            <span>🔍</span>
            <span>Disponibilidad</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroomerDashboard;
