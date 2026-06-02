import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { getAllUsers } from '../../api/auth';
import { getAllPets } from '../../api/pets';
import { getAllAppointments } from '../../api/appointments';
import { getGroomerApplications } from '../../api/auth';
import { getAllInvoices } from '../../api/invoices';
import { useUser } from '../../components/Context/UserContext';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const AdminDashboard = () => {
  const { user } = useUser();
  const [currentDate, setCurrentDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Datos reales de los servicios
  const [users, setUsers] = useState([]);
  const [pets, setPets] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [groomerApplications, setGroomerApplications] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const date = new Date().toLocaleDateString('es-CO', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    setCurrentDate(date.charAt(0).toUpperCase() + date.slice(1));
  }, []);

  // Cargar datos reales de los servicios
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        const [usersData, petsData, appointmentsData, groomerAppsData, invoicesData] = await Promise.all([
          getAllUsers(token),
          getAllPets(),
          getAllAppointments(),
          getGroomerApplications(token, 'pending').catch(() => []),
          getAllInvoices().catch(() => []),
        ]);
        
        setUsers(usersData);
        setPets(petsData);
        setAppointments(appointmentsData);
        setGroomerApplications(groomerAppsData);
        setInvoices(invoicesData);
        
        // Crear notificaciones
        const newNotifications = [];
        if (groomerAppsData.length > 0) {
          newNotifications.push({
            id: 'groomer-apps',
            type: 'warning',
            message: `${groomerAppsData.length} solicitud${groomerAppsData.length > 1 ? 'es' : ''} de groomer pendiente${groomerAppsData.length > 1 ? 's' : ''}`,
            link: '/admin/groomer-applications'
          });
        }
        if (appointmentsData.filter(a => a.status === 'pending').length > 0) {
          newNotifications.push({
            id: 'pending-appointments',
            type: 'info',
            message: `${appointmentsData.filter(a => a.status === 'pending').length} citas pendientes`,
            link: '/admin/appointments'
          });
        }
        setNotifications(newNotifications);
      } catch (err) {
        console.error('Error cargando datos:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();

    // Actualizar datos cada 30 segundos
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  const adminName = user?.nombre_completo || 'Administrador';

  // === Actividad en Tiempo Real ===
  const [activities, setActivities] = useState([]);

  // Generar actividad real desde appointments
  useEffect(() => {
    if (appointments.length > 0) {
      const recentActivities = appointments.slice(0, 5).map(appt => ({
        id: appt.id,
        text: `Cita ${appt.status === 'completed' ? 'completada' : appt.status === 'pending' ? 'pendiente' : appt.status} para ${appt.service}`,
        time: new Date(appt.created_at || Date.now()).toLocaleDateString('es-CO', { 
          day: 'numeric', 
          month: 'short' 
        })
      }));
      setActivities(recentActivities);
    }
  }, [appointments]);

  // === Agenda General del Día (con filtros) ===
  const [agendaFilter, setAgendaFilter] = useState({
    dia: 'hoy',
    groomer: 'Todos',
    servicio: 'Todos'
  });

  // Convertir appointments al formato esperado
  const allAppointments = appointments.map(appt => ({
    id: appt.id,
    fecha: new Date(appt.date).toDateString() === new Date().toDateString() ? 'hoy' : 'mañana',
    hora: appt.time,
    // Preferir nombres enriquecidos del appointments-service si vienen, si no buscar en users/pets.
    cliente: appt.client_name || users.find(u => u.email === appt.client_email)?.nombre_completo || appt.client_email,
    mascota: appt.pet_name || pets.find(p => p.id === appt.pet_id)?.name || `Pet #${appt.pet_id}`,
    servicio: appt.service,
    groomer: users.find(u => u.email === appt.groomer_email)?.nombre_completo || appt.groomer_email || 'Sin asignar',
    estado: appt.status,
  }));

  // Filtrado dinámico
  const filteredAppointments = allAppointments.filter(appt => {
    const matchDia = appt.fecha === agendaFilter.dia;
    const matchGroomer = agendaFilter.groomer === 'Todos' || appt.groomer === agendaFilter.groomer;
    const matchServicio = agendaFilter.servicio === 'Todos' || appt.servicio === agendaFilter.servicio;
    return matchDia && matchGroomer && matchServicio;
  });

  // Opciones únicas para los selects
  const groomers = ['Todos', ...new Set(allAppointments.map(a => a.groomer))];
  const servicios = ['Todos', ...new Set(allAppointments.map(a => a.servicio))];

  // === Finanzas ===
  const [financePeriod, setFinancePeriod] = useState('mes'); // 'hoy' | 'semana' | 'mes'

  // Calcular datos financieros desde appointments reales
  const calculateFinanceData = () => {
    // Finanzas basadas en FACTURAS (no en citas), para reflejar pago en efectivo.
    // Nota: por simplicidad en esta versión, los 3 periodos usan el mismo agregado.
    const totalFacturado = invoices.reduce((sum, i) => sum + (Number(i.total) || 0), 0);
    const pendientes = invoices.filter(i => i.status === 'pending').reduce((sum, i) => sum + (Number(i.total) || 0), 0);
    const pagadas = invoices.filter(i => i.status === 'paid');

    // Comisiones = ingreso de la plataforma (según cada factura pagada; histórico preservado).
    const platformIncome = pagadas.reduce((sum, i) => sum + (Number(i.platform_amount) || 0), 0);

    const base = {
      diario: totalFacturado,
      semanal: totalFacturado,
      mensual: totalFacturado,
      comisiones: platformIncome,
      pendientes,
      pagados: pagadas.length,
    };

    return { hoy: base, semana: base, mes: base };
  };

  const financeData = calculateFinanceData();
  const currentFinance = financeData[financePeriod];

  // Sección de Groomers movida completamente a /admin/groomers

  // Datos para Últimos Clientes y Mascotas
  const recentClients = users.slice(0, 4).map(user => ({
    id: user.id,
    nombre: user.nombre_completo,
    fechaRegistro: new Date(user.created_at || Date.now()).toLocaleDateString('es-CO', { 
      day: 'numeric', 
      month: 'short' 
    })
  }));

  const recentPets = pets.slice(0, 4).map(pet => ({
    id: pet.id,
    foto: pet.owner_email ? `https://i.pravatar.cc/36?u=${pet.owner_email}` : 'https://i.pravatar.cc/36',
    nombre: pet.name,
    raza: pet.breed,
    dueño: users.find(u => u.email === pet.owner_email)?.nombre_completo || pet.owner_email
  }));

  // ==================== GRÁFICAS Y ANALÍTICAS ====================

  // Calcular datos de gráficas desde appointments reales
  const serviceCounts = appointments.reduce((acc, appt) => {
    acc[appt.service] = (acc[appt.service] || 0) + 1;
    return acc;
  }, {});

  // A) Gráfica de Barras - Servicios por tipo
  const barData = {
    labels: Object.keys(serviceCounts).length > 0 ? Object.keys(serviceCounts) : ['Sin datos'],
    datasets: [
      {
        label: 'Servicios realizados',
        data: Object.keys(serviceCounts).length > 0 ? Object.values(serviceCounts) : [0],
        backgroundColor: '#d96c5f',
        borderRadius: 6,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true } },
  };

  // B) Donut Chart - Distribución de ingresos
  const serviceRevenue = appointments
    .filter(a => a.status === 'completed')
    .reduce((acc, appt) => {
      acc[appt.service] = (acc[appt.service] || 0) + (appt.price || 0);
      return acc;
    }, {});

  const donutData = {
    labels: Object.keys(serviceRevenue).length > 0 ? Object.keys(serviceRevenue) : ['Sin datos'],
    datasets: [
      {
        data: Object.keys(serviceRevenue).length > 0 ? Object.values(serviceRevenue) : [1],
        backgroundColor: Object.keys(serviceRevenue).length > 0 
          ? ['#d96c5f', '#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6'] 
          : ['#ccc'],
        borderWidth: 3,
        borderColor: '#111',
      },
    ],
  };

  const donutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%',
    plugins: {
      legend: { position: 'right' },
    },
  };

  // C) Line Chart - Ingresos mensuales (simplificado para datos reales)
  const monthlyLineData = {
    labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Ingresos ($)',
        data: [0, 0, 0, 0, 0, financeData.mes.mensual],
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        borderWidth: 3,
        pointRadius: 4,
        fill: false,
      },
    ],
  };

  const monthlyLineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true } },
  };

  // D) Gráfica de actividad - Servicios por día (simplificado para datos reales)
  const daysOfWeek = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  const servicesByDay = daysOfWeek.map(() => 
    appointments.filter(a => {
      const day = new Date(a.date).getDay();
      return day === daysOfWeek.indexOf(day) + 1 || (day === 0 && daysOfWeek.indexOf('Dom') === 6);
    }).length
  );

  const weeklyServicesData = {
    labels: daysOfWeek,
    datasets: [
      {
        label: 'Servicios',
        data: servicesByDay,
        backgroundColor: '#22c55e',
        borderRadius: 6,
      },
    ],
  };

  const weeklyServicesOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true } },
  };

  return (
    <div className="admin-dashboard">
      {loading ? (
        <div className="loading-container">
          <p>Cargando datos del dashboard...</p>
        </div>
      ) : error ? (
        <div className="error-container">
          <p>Error: {error}</p>
        </div>
      ) : (
        <>
      {/* Welcome Banner */}
      <div className="welcome-banner">
        <div className="welcome-info">
          <h1>{getGreeting()}, {adminName}</h1>
          <p className="welcome-date">{currentDate}</p>
        </div>

        <div className="system-status">
          {/* Notification Bell */}
          <div className="notification-container">
            <button 
              className="notification-bell"
              onClick={() => setShowNotifications(!showNotifications)}
              title="Notificaciones"
            >
              🔔
              {notifications.length > 0 && (
                <span className="notification-badge">{notifications.length}</span>
              )}
            </button>
            {showNotifications && (
              <div className="notification-dropdown">
                {notifications.length > 0 ? (
                  notifications.map(notif => (
                    <div 
                      key={notif.id} 
                      className={`notification-item ${notif.type}`}
                      onClick={() => {
                        window.location.href = notif.link;
                        setShowNotifications(false);
                      }}
                    >
                      <span className="notification-icon">
                        {notif.type === 'warning' ? '⚠️' : 'ℹ️'}
                      </span>
                      <span className="notification-text">{notif.message}</span>
                    </div>
                  ))
                ) : (
                  <div className="notification-item empty">
                    No hay notificaciones
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="status-indicator">
            <span className="status-dot online"></span>
            <span>Sistema operativo</span>
          </div>
          <small>Última verificación: hace 2 minutos</small>
        </div>
      </div>

      <div className="admin-main-sections">

      {/* Gráficas y Analíticas */}
      <div className="analytics-section">
        <div className="analytics-header">
          <h3>📊 Gráficas y Analíticas</h3>
          <span className="analytics-subtitle">Resumen visual del negocio</span>
        </div>

        <div className="charts-grid">
          {/* A) Barras - Servicios por tipo */}
          <div className="chart-card">
            <h4>Servicios por tipo</h4>
            <div className="chart-wrapper">
              <Bar data={barData} options={barOptions} />
            </div>
          </div>

          {/* B) Donut - Distribución de ingresos */}
          <div className="chart-card">
            <h4>Distribución de ingresos</h4>
            <div className="chart-wrapper">
              <Doughnut data={donutData} options={donutOptions} />
            </div>
          </div>

          {/* C) Línea - Ingresos mensuales */}
          <div className="chart-card">
            <h4>Ingresos mensuales</h4>
            <div className="chart-wrapper">
              <Line data={monthlyLineData} options={monthlyLineOptions} />
            </div>
          </div>

          {/* D) Barras - Servicios por día (semanal) */}
          <div className="chart-card">
            <h4>Servicios por día</h4>
            <div className="chart-wrapper">
              <Bar data={weeklyServicesData} options={weeklyServicesOptions} />
            </div>
          </div>
        </div>
      </div>

      {/* Stats cards moved to /admin/users (Clientes) */}

      {/* Sección de Groomers movida a /admin/groomers */}

      {/* Últimos Clientes y Mascotas */}
      <div className="clients-pets-section section-card">
        <div className="section-header">
          <h3>👥 Últimos Clientes y Mascotas</h3>
          <span className="section-count">Actividad reciente</span>
        </div>

        <div className="clients-pets-grid">
          {/* Clientes recientes */}
          <div className="clients-column">
            <h4>Clientes</h4>
            <table className="mini-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Fecha registro</th>
                </tr>
              </thead>
              <tbody>
                {recentClients.map(client => (
                  <tr key={client.id}>
                    <td>{client.nombre}</td>
                    <td className="text-muted">{client.fechaRegistro}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mascotas recientes */}
          <div className="pets-column">
            <h4>Mascotas</h4>
            <table className="mini-table">
              <thead>
                <tr>
                  <th>Foto</th>
                  <th>Nombre</th>
                  <th>Raza</th>
                  <th>Dueño</th>
                </tr>
              </thead>
              <tbody>
                {recentPets.map(pet => (
                  <tr key={pet.id}>
                    <td>
                      <img 
                        src={pet.foto} 
                        alt={pet.nombre} 
                        className="pet-avatar" 
                      />
                    </td>
                    <td>{pet.nombre}</td>
                    <td>{pet.raza}</td>
                    <td className="text-muted">{pet.dueño}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Actividad en Tiempo Real */}
      <div className="section-card live-activity">
        <div className="section-header">
          <h3>📈 Actividad en Tiempo Real</h3>
          <div className="live-badge">
            <span className="live-dot"></span>
            En vivo
          </div>
        </div>

        <div className="activity-list">
          {activities.map((activity, index) => (
            <div key={activity.id} className={`activity-item ${index === 0 ? 'new' : ''}`}>
              <span className="activity-time">{activity.time}</span>
              <span className="activity-text">{activity.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Alertas */}
      <div className="section-card">
        <h3>⚠️ Alertas</h3>
        <div className="alerts-list">
          {groomerApplications.length > 0 && (
            <div className="alert-item warning" style={{ cursor: 'pointer' }} onClick={() => window.location.href = '/admin/groomer-applications'}>
              📋 {groomerApplications.length} solicitud{groomerApplications.length > 1 ? 'es' : ''} de groomer pendiente{groomerApplications.length > 1 ? 's' : ''} - Revisar ahora
            </div>
          )}
          {appointments.filter(a => a.status === 'pending').length > 0 && (
            <div className="alert-item info">
              {appointments.filter(a => a.status === 'pending').length} citas pendientes de confirmación
            </div>
          )}
          {appointments.filter(a => a.status === 'cancelled').length > 0 && (
            <div className="alert-item info">
              {appointments.filter(a => a.status === 'cancelled').length} citas canceladas recientemente
            </div>
          )}
          {groomerApplications.length === 0 &&
           appointments.filter(a => a.status === 'pending').length === 0 && 
           appointments.filter(a => a.status === 'cancelled').length === 0 && (
            <div className="alert-item info">
              No hay alertas pendientes
            </div>
          )}
        </div>
      </div>

      {/* Agenda General del Día */}
      <div className="agenda-section">
        <div className="agenda-header">
          <h3>📅 Agenda General del Día</h3>
          <span className="agenda-count">{filteredAppointments.length} citas</span>
        </div>

        {/* Filtros rápidos */}
        <div className="agenda-filters">
          <div className="filter-group">
            <button 
              className={agendaFilter.dia === 'hoy' ? 'active' : ''} 
              onClick={() => setAgendaFilter(prev => ({ ...prev, dia: 'hoy' }))}
            >
              Hoy
            </button>
            <button 
              className={agendaFilter.dia === 'mañana' ? 'active' : ''} 
              onClick={() => setAgendaFilter(prev => ({ ...prev, dia: 'mañana' }))}
            >
              Mañana
            </button>
          </div>

          <div className="filter-group">
            <select 
              value={agendaFilter.groomer} 
              onChange={(e) => setAgendaFilter(prev => ({ ...prev, groomer: e.target.value }))}
            >
              {groomers.map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>

            <select 
              value={agendaFilter.servicio} 
              onChange={(e) => setAgendaFilter(prev => ({ ...prev, servicio: e.target.value }))}
            >
              {servicios.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="agenda-table-wrapper">
          <table className="agenda-table">
            <thead>
              <tr>
                <th>Hora</th>
                <th>Cliente</th>
                <th>Mascota</th>
                <th>Servicio</th>
                <th>Groomer</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {filteredAppointments.length > 0 ? (
                filteredAppointments.map((cita) => (
                  <tr key={cita.id}>
                    <td className="hora">{cita.hora}</td>
                    <td>{cita.cliente}</td>
                    <td>{cita.mascota}</td>
                    <td>{cita.servicio}</td>
                    <td>{cita.groomer}</td>
                    <td>
                      <span className={`status-badge ${cita.estado.toLowerCase().replace(/\s+/g, '')}`}>
                        {cita.estado}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="no-results">No hay citas con los filtros seleccionados.</td>
                </tr>
              )}
            </tbody>
            </table>
           </div>
        </div>



        {/* 8. Finanzas */}
        <div className="finance-section section-card">
          <div className="section-header">
            <h3>💰 Finanzas</h3>
            <div className="finance-filters">
              <button 
                className={financePeriod === 'hoy' ? 'active' : ''} 
                onClick={() => setFinancePeriod('hoy')}
              >
                Hoy
              </button>
              <button 
                className={financePeriod === 'semana' ? 'active' : ''} 
                onClick={() => setFinancePeriod('semana')}
              >
                Esta semana
              </button>
              <button 
                className={financePeriod === 'mes' ? 'active' : ''} 
                onClick={() => setFinancePeriod('mes')}
              >
                Este mes
              </button>
            </div>
          </div>

          <div className="finance-grid">
            <div className="finance-card">
              <div className="finance-label">Ingresos diarios</div>
              <div className="finance-value">${currentFinance.diario.toLocaleString()}</div>
            </div>
            <div className="finance-card">
              <div className="finance-label">Ingresos semanales</div>
              <div className="finance-value">${currentFinance.semanal.toLocaleString()}</div>
            </div>
            <div className="finance-card">
              <div className="finance-label">Ingresos mensuales</div>
              <div className="finance-value">${currentFinance.mensual.toLocaleString()}</div>
            </div>
            <div className="finance-card">
              <div className="finance-label">Comisiones</div>
              <div className="finance-value">${currentFinance.comisiones.toLocaleString()}</div>
            </div>
            <div className="finance-card warning">
              <div className="finance-label">Pagos pendientes</div>
              <div className="finance-value">${currentFinance.pendientes.toLocaleString()}</div>
              <div className="finance-sub">12 servicios</div>
            </div>
            <div className="finance-card">
              <div className="finance-label">Servicios pagados</div>
              <div className="finance-value">{currentFinance.pagados}</div>
            </div>
          </div>
        </div>

       </div> {/* Cierre de admin-main-sections */}

      </>
      )}
    </div>
  );
};

export default AdminDashboard;
