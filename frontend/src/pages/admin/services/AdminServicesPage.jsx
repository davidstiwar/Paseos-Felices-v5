import React, { useState, useEffect, useCallback } from 'react';
import { getAllServices, createService, updateService, deleteService } from '../../../api/servicesCatalog';
import { getAllAppointments } from '../../../api/appointments';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { useToast } from '../../../components/Context/ToastContext';
import ModalDialog from '../../../components/Common/ModalDialog';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Helpers puros (fuera del componente) para evitar recreación en cada render
const categoryToUI = {
  paseo: 'Paseos',
  grooming: 'Grooming',
  entrenamiento: 'Entrenamiento',
  cuidado_casa: 'Cuidado en casa',
  otro: 'Otro',
};

const uiToCategory = {
  Paseos: 'paseo',
  Grooming: 'grooming',
  Baños: 'grooming',
  Entrenamiento: 'entrenamiento',
  'Cuidado en casa': 'cuidado_casa',
  Otro: 'otro',
};

const formatDuration = (minutes) => {
  if (!minutes && minutes !== 0) return '';
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

const parseDurationToMinutes = (dur) => {
  if (!dur) return 30;
  const str = dur.toString().toLowerCase().trim();
  if (str.includes('h')) {
    const parts = str.split('h');
    const hours = parseInt(parts[0]) || 0;
    const mins = parts[1] ? parseInt(parts[1]) || 0 : 0;
    return hours * 60 + mins;
  }
  if (str.includes('m')) {
    return parseInt(str) || 30;
  }
  return parseInt(str) || 30;
};

const mapFromBackend = (svc) => ({
  id: svc.id,
  nombre: svc.name,
  categoria: categoryToUI[svc.category] || svc.category,
  precio: svc.base_price,
  duracion: formatDuration(svc.duration_minutes),
  estado: svc.is_active ? 'Activo' : 'Inactivo',
  reservas: 0,
  descripcion: svc.description || '',
  _raw: svc,
});

const mapToBackend = (uiService) => ({
  name: uiService.nombre,
  description: uiService.descripcion || null,
  category: uiToCategory[uiService.categoria] || 'paseo',
  base_price: Number(uiService.precio) || 0,
  duration_minutes: parseDurationToMinutes(uiService.duracion),
  is_active: uiService.estado === 'Activo',
});

const AdminServicesPage = () => {
  const { showError, showSuccess } = useToast();
  const [services, setServices] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedService, setSelectedService] = useState(null);
  const [modalType, setModalType] = useState(null); // 'view' | 'edit' | 'create'
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, serviceId: null });

  const loadServices = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const [servicesData, appointmentsData] = await Promise.all([
        getAllServices(false), // cargar todos (activos + inactivos)
        getAllAppointments()
      ]);
      setServices(servicesData.map(mapFromBackend));
      setAppointments(appointmentsData);
    } catch (err) {
      console.error('Error cargando catálogo:', err);
      setError(err.message || 'Error al cargar los servicios del catálogo');
      setServices([]);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  const handleView = (service) => {
    setSelectedService(service);
    setModalType('view');
  };

  const handleEdit = (service) => {
    setSelectedService({ ...service });
    setModalType('edit');
  };

  const handleDelete = async (id) => {
    setDeleteConfirm({ isOpen: true, serviceId: id });
  };

  const confirmDelete = async () => {
    const { serviceId } = deleteConfirm;
    try {
      await deleteService(serviceId);
      await loadServices();
      showSuccess('Servicio eliminado exitosamente');
      setDeleteConfirm({ isOpen: false, serviceId: null });
    } catch (err) {
      showError(err.message || 'Error al eliminar el servicio');
      setDeleteConfirm({ isOpen: false, serviceId: null });
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedService) return;

    try {
      const payload = mapToBackend(selectedService);

      if (modalType === 'create') {
        await createService(payload);
      } else {
        await updateService(selectedService.id, payload);
      }

      setModalType(null);
      setSelectedService(null);
      await loadServices();
      showSuccess('Servicio guardado exitosamente');
    } catch (err) {
      showError(err.message || 'Error al guardar el servicio');
    }
  };

  const closeServiceModal = () => {
    setModalType(null);
    setSelectedService(null);
  };

  const handleFormChange = (field, value) => {
    setSelectedService(prev => ({ ...prev, [field]: value }));
  };

  const handleCreateNew = () => {
    setSelectedService({
      id: null,
      nombre: '',
      categoria: 'Paseos',
      precio: 0,
      duracion: '30m',
      estado: 'Activo',
      reservas: 0,
      descripcion: ''
    });
    setModalType('create');
  };

  const filteredServices = services.filter(servicio => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    return (
      servicio.nombre.toLowerCase().includes(term) ||
      servicio.categoria.toLowerCase().includes(term) ||
      (servicio.descripcion || '').toLowerCase().includes(term)
    );
  });

  // Calcular estadísticas dinámicas
  const activeServicesCount = services.filter(s => s.estado === 'Activo').length;
  
  // Calcular servicio más solicitado desde appointments
  const serviceUsage = {};
  appointments.forEach(apt => {
    const serviceName = apt.service_name || 'Desconocido';
    serviceUsage[serviceName] = (serviceUsage[serviceName] || 0) + 1;
  });
  const mostRequestedService = Object.entries(serviceUsage).sort((a, b) => b[1] - a[1])[0] || ['Sin datos', 0];
  
  // Calcular servicios reservados hoy
  const today = new Date().toISOString().split('T')[0];
  const todayAppointments = appointments.filter(apt => apt.appointment_date === today).length;
  
  // Calcular ingresos generados
  const totalRevenue = appointments.reduce((sum, apt) => sum + (apt.price || 0), 0);
  
  // Calcular datos para gráficas
  const servicesByCategory = {};
  services.forEach(s => {
    servicesByCategory[s.categoria] = (servicesByCategory[s.categoria] || 0) + 1;
  });
  
  const revenueByService = {};
  appointments.forEach(apt => {
    const serviceName = apt.service_name || 'Desconocido';
    revenueByService[serviceName] = (revenueByService[serviceName] || 0) + (apt.price || 0);
  });
  
  // Calcular reservas por semana (últimos 7 días)
  const last7Days = [];
  const reservationsByDay = {};
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    last7Days.push(dateStr);
    reservationsByDay[dateStr] = 0;
  }
  appointments.forEach(apt => {
    if (apt.appointment_date && reservationsByDay.hasOwnProperty(apt.appointment_date)) {
      reservationsByDay[apt.appointment_date]++;
    }
  });
  const weeklyReservations = last7Days.map(date => reservationsByDay[date]);

  return (
    <div className="admin-page">
      {/* Header Superior */}
      <div className="admin-page-header">
        <div className="admin-page-header__main">
          <div className="admin-page-header__title">
            <h1>Servicios</h1>
          </div>
          <p className="admin-page-header__subtitle">
            Gestiona todos los servicios ofrecidos por la plataforma.
          </p>
           <div className="admin-page-header__actions">
             <button onClick={handleCreateNew} className="btn-primary">+ Crear servicio</button>
           </div>
         </div>
       </div>

       {loading && (
         <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
           Cargando servicios del catálogo...
         </div>
       )}

       {error && (
         <div style={{
           background: '#fee2e2',
           color: '#b91c1c',
           padding: '12px 20px',
           borderRadius: '8px',
           margin: '16px 0',
           fontWeight: 500
         }}>
           {error} — <button onClick={loadServices} style={{ color: '#b91c1c', textDecoration: 'underline' }}>Reintentar</button>
         </div>
       )}

      {/* Cards Estadísticas */}
      <div className="main-stats-grid">
        <div className="stat-card stat-card-primary">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>Servicios Activos</h3>
             <p className="stat-number">{activeServicesCount}</p>
            <span className="stat-trend neutral">Total activo</span>
          </div>
        </div>
        <div className="stat-card stat-card-success">
          <div className="stat-icon">🔥</div>
          <div className="stat-content">
            <h3>Más Solicitado</h3>
            <p className="stat-number">{mostRequestedService[0]}</p>
            <span className="stat-trend neutral">{mostRequestedService[1]} reservas</span>
          </div>
        </div>
        <div className="stat-card stat-card-info">
          <div className="stat-icon">📅</div>
          <div className="stat-content">
            <h3>Servicios Reservados Hoy</h3>
            <p className="stat-number">{todayAppointments}</p>
            <span className="stat-trend neutral">Total hoy</span>
          </div>
        </div>
        <div className="stat-card stat-card-secondary">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <h3>Ingresos Generados</h3>
            <p className="stat-number">${totalRevenue.toLocaleString('es-CO')}</p>
            <span className="stat-trend neutral">Total ingresos</span>
          </div>
        </div>
      </div>

      {/* Gráficas del módulo */}
      <div style={{ marginTop: '50px' }}>
        <h2 style={{ marginBottom: '24px', fontSize: '20px' }}>Gráficas del módulo</h2>

        <div className="charts-grid">
          <div className="chart-card">
            <h3>Servicios más utilizados</h3>
            <Bar
              data={{
                labels: Object.keys(servicesByCategory).length > 0 ? Object.keys(servicesByCategory) : ['Sin datos'],
                datasets: [{ 
                  label: 'Cantidad', 
                  data: Object.keys(servicesByCategory).length > 0 ? Object.values(servicesByCategory) : [0], 
                  backgroundColor: ['#d96c5f', '#8b5cf6', '#10b981', '#f59e0b'] 
                }],
              }}
              options={{ responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }}
            />
          </div>

          <div className="chart-card">
            <h3>Ingresos por servicio</h3>
            <Doughnut
              data={{
                labels: Object.keys(revenueByService).length > 0 ? Object.keys(revenueByService) : ['Sin datos'],
                datasets: [{ 
                  data: Object.keys(revenueByService).length > 0 ? Object.values(revenueByService) : [0], 
                  backgroundColor: ['#8b5cf6', '#d96c5f', '#f59e0b'], 
                  borderWidth: 0 
                }],
              }}
              options={{ responsive: true, plugins: { legend: { position: 'bottom' } } }}
            />
          </div>
        </div>

        <div className="chart-card chart-card--full">
          <h3>Reservas por semana</h3>
          <div style={{ height: '320px', position: 'relative' }}>
            <Line
              data={{
                labels: last7Days.map(date => new Date(date).toLocaleDateString('es-CO', { weekday: 'short' })),
                datasets: [{ 
                  label: 'Reservas', 
                  data: weeklyReservations, 
                  borderColor: '#d96c5f', 
                  tension: 0.4, 
                  fill: true 
                }],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  y: { beginAtZero: true },
                  x: { ticks: { autoSkip: false } }
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Tabla Principal de Servicios */}
      <div style={{ marginTop: '50px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ margin: 0, fontSize: '20px' }}>
            Servicios
            <span style={{ fontSize: '14px', color: '#888', marginLeft: '10px', fontWeight: 'normal' }}>
              {filteredServices.length} de {services.length}
            </span>
          </h2>
          <div className="search-wrapper">
            <input
              type="text"
              placeholder="Buscar por nombre, categoría o descripción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            {searchTerm && (
              <button
                className="clear-search-btn"
                onClick={() => setSearchTerm('')}
              >
                ×
              </button>
            )}
          </div>
        </div>

         <div className="usuarios-table-wrapper">
           <table className="usuarios-table">
             <thead>
               <tr>
                 <th>Servicio</th>
                 <th>Categoría</th>
                 <th>Descripción</th>
                 <th>Precio</th>
                 <th>Duración</th>
                 <th>Estado</th>
                 <th>Reservas</th>
                 <th>Acciones</th>
               </tr>
             </thead>
             <tbody>
               {!loading && filteredServices.length === 0 && (
                 <tr>
                   <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
                     {services.length === 0 
                       ? 'No hay servicios en el catálogo todavía. Crea el primero.' 
                       : 'No se encontraron servicios con ese filtro.'}
                   </td>
                 </tr>
               )}
               {filteredServices.map((servicio) => (
                <tr key={servicio.id}>
                  <td><strong>{servicio.nombre}</strong></td>
                  <td>{servicio.categoria}</td>
                  <td style={{ maxWidth: '220px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {servicio.descripcion || '—'}
                  </td>
                  <td>${servicio.precio.toLocaleString('es-CO')}</td>
                  <td>{servicio.duracion}</td>
                  <td>
                    <span className={`status-badge ${servicio.estado.toLowerCase()}`}>{servicio.estado}</span>
                  </td>
                  <td>{servicio.reservas}</td>
                  <td className="actions-cell">
                    <button type="button" onClick={() => handleView(servicio)} title="Ver detalle">👁</button>
                    <button type="button" onClick={() => handleEdit(servicio)} title="Editar">✏️</button>
                    <button type="button" onClick={() => handleDelete(servicio.id)} title="Eliminar" className="danger">🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODALES PARA ACCIONES */}
      {modalType && selectedService && (
        <div className="modal-overlay" onClick={closeServiceModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3>
                {modalType === 'view' && 'Detalle del Servicio'}
                {modalType === 'edit' && 'Editar Servicio'}
                {modalType === 'create' && 'Nuevo Servicio'}
              </h3>
              <button onClick={closeServiceModal} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>×</button>
            </div>

            {modalType === 'view' && (
              <div>
                <p><strong>Nombre:</strong> {selectedService.nombre}</p>
                <p><strong>Categoría:</strong> {selectedService.categoria}</p>
                <p><strong>Descripción:</strong> {selectedService.descripcion || 'Sin descripción'}</p>
                <p><strong>Precio:</strong> ${selectedService.precio.toLocaleString('es-CO')}</p>
                <p><strong>Duración:</strong> {selectedService.duracion}</p>
                <p><strong>Estado:</strong> {selectedService.estado}</p>
                <p><strong>Reservas totales:</strong> {selectedService.reservas}</p>
              </div>
            )}

            {(modalType === 'edit' || modalType === 'create') && (
              <div>
                <div style={{ marginBottom: '12px' }}>
                  <label>Nombre del servicio</label>
                  <input 
                    value={selectedService.nombre} 
                    onChange={e => handleFormChange('nombre', e.target.value)} 
                    placeholder="Ej: Paseo Premium 1 hora"
                    style={{ width: '100%', padding: '10px' }} 
                  />
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <label>Categoría</label>
                  <select 
                    value={selectedService.categoria} 
                    onChange={e => handleFormChange('categoria', e.target.value)} 
                    style={{ width: '100%', padding: '10px' }}
                  >
                    <option value="Paseos">Paseos</option>
                    <option value="Grooming">Grooming</option>
                    <option value="Baños">Baños</option>
                    <option value="Entrenamiento">Entrenamiento</option>
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <label>Precio (COP)</label>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span style={{ padding: '10px', background: '#222', border: '1px solid #333', borderRight: 'none', borderRadius: '6px 0 0 6px' }}>$</span>
                      <input 
                        type="number" 
                        value={selectedService.precio} 
                        onChange={e => handleFormChange('precio', Number(e.target.value))} 
                        style={{ width: '100%', padding: '10px', borderRadius: '0 6px 6px 0' }} 
                      />
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label>Duración</label>
                    <input 
                      value={selectedService.duracion} 
                      onChange={e => handleFormChange('duracion', e.target.value)} 
                      placeholder="Ej: 30m, 1h, 2h"
                      style={{ width: '100%', padding: '10px' }} 
                    />
                  </div>
                </div>

                <div style={{ marginTop: '12px' }}>
                  <label>Estado</label>
                  <select 
                    value={selectedService.estado} 
                    onChange={e => handleFormChange('estado', e.target.value)} 
                    style={{ width: '100%', padding: '10px' }}
                  >
                    <option value="Activo">Activo</option>
                    <option value="Inactivo">Inactivo</option>
                  </select>
                </div>

                <div style={{ marginTop: '12px' }}>
                  <label>Descripción</label>
                  <textarea 
                    value={selectedService.descripcion || ''} 
                    onChange={e => handleFormChange('descripcion', e.target.value)} 
                    placeholder="Describe brevemente el servicio..."
                    rows={3}
                    style={{ width: '100%', padding: '10px', resize: 'vertical' }} 
                  />
                </div>
              </div>
            )}

            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={closeServiceModal}>Cancelar</button>
              {(modalType === 'edit' || modalType === 'create') && (
                <button onClick={handleSaveEdit} className="btn-primary">
                  {modalType === 'create' ? 'Crear servicio' : 'Guardar cambios'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      <ModalDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, serviceId: null })}
        title="Confirmar eliminación"
        actions={[
          { label: 'Cancelar', variant: 'secondary', onClick: () => setDeleteConfirm({ isOpen: false, serviceId: null }) },
          { label: 'Eliminar', variant: 'danger', onClick: confirmDelete }
        ]}
      >
        <p>¿Estás seguro de eliminar este servicio del catálogo?</p>
      </ModalDialog>
    </div>
  );
};

export default AdminServicesPage;
