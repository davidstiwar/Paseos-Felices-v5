import React, { useState, useEffect } from 'react';
import { getAllAppointments, createAppointment, updateAppointment, cancelAppointment } from '../../../api/appointments';
import { getAllUsers } from '../../../api/auth';
import { getAllPets } from '../../../api/pets';
import { getAllServices } from '../../../api/servicesCatalog';
import { getGroomersByService } from '../../../api/groomer';
import { useToast } from '../../../components/Context/ToastContext';
import ModalDialog from '../../../components/Common/ModalDialog';

const AdminAppointmentsPage = () => {
  const { showError, showSuccess } = useToast();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [modalType, setModalType] = useState(null); // 'view' | 'edit' | 'create'
  const [cancelConfirm, setCancelConfirm] = useState({ isOpen: false, appointmentId: null });

  // Datos para el formulario de creación
  const [clients, setClients] = useState([]);
  const [pets, setPets] = useState([]);
  const [services, setServices] = useState([]);
  const [groomers, setGroomers] = useState([]);

  // Mapeo de estados de backend a frontend
  const statusToEstado = (status) => {
    const statusMap = {
      'pending': 'Pendiente',
      'confirmed': 'Confirmada',
      'in_progress': 'En progreso',
      'completed': 'Completada',
      'cancelled': 'Cancelada'
    };
    return statusMap[status?.toLowerCase()] || (status || 'Pendiente');
  };

  const loadAppointments = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getAllAppointments();
      // Mapear los datos del backend al formato del frontend
      const mappedData = data.map(appt => ({
        ...appt,
        id: appt.id,
        fecha: appt.date || appt.fecha,
        hora: appt.time || appt.hora,
        cliente: appt.client_email || appt.cliente,
        mascota: appt.pet_id || appt.mascota,
        servicio: appt.service || appt.servicio,
        groomer: appt.groomer_email || appt.groomer,
        estado: statusToEstado(appt.status),
        notas: appt.notes || appt.notas,
      }));
      setAppointments(mappedData);
    } catch (err) {
      console.error('Error cargando citas:', err);
      setError(err.message || 'Error al cargar las citas');
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadClients = async () => {
    try {
      const users = await getAllUsers();
      // Filtrar por diferentes posibles formatos de rol
      const clientUsers = users.filter(u => {
        const role = (u.rol || u.role || '').toLowerCase();
        return role === 'cliente' || role === 'client';
      });
      setClients(clientUsers);
    } catch (err) {
      console.error('Error cargando clientes:', err);
      setClients([]);
    }
  };

  const loadServices = async () => {
    try {
      const servicesData = await getAllServices(false);
      setServices(servicesData || []);
    } catch (err) {
      console.error('Error cargando servicios:', err);
      setServices([]);
    }
  };

  const loadPetsByClient = async (clientEmail) => {
    try {
      const allPets = await getAllPets();
      // Manejar diferentes formatos de campo de email del dueño
      const clientPets = allPets.filter(p => {
        const ownerEmail = p.owner_email || p.ownerEmail || p.client_email || p.clientEmail || '';
        return ownerEmail.toLowerCase() === clientEmail.toLowerCase();
      });
      setPets(clientPets);
    } catch (err) {
      console.error('Error cargando mascotas:', err);
      setPets([]);
    }
  };

  const loadGroomersByService = async (serviceName) => {
    try {
      const groomersData = await getGroomersByService(serviceName);
      setGroomers(groomersData || []);
    } catch (err) {
      console.error('Error cargando groomers:', err);
      setGroomers([]);
    }
  };

  // Helper para obtener el día de la semana en español
  const getDayName = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('es-ES', { weekday: 'long' });
  };

  // Fecha mínima permitida (hoy)
  const todayStr = new Date().toISOString().split('T')[0];

  const handleView = (appt) => {
    setSelectedAppt(appt);
    setModalType('view');
  };

  const handleEdit = (appt) => {
    const blockedStates = ['Cancelada', 'Completada', 'En progreso'];
    if (blockedStates.includes(appt.estado)) {
      showError(`No se puede editar una cita que está ${appt.estado.toLowerCase()}.`);
      return;
    }
    setSelectedAppt({ ...appt });
    setModalType('edit');
  };

  const handleCreateNew = async () => {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const defaultTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    setSelectedAppt({
      id: null,
      fecha: today,
      hora: defaultTime,
      cliente: '',
      mascota: '',
      servicio: '',
      groomer: '',
      estado: 'Pendiente',
      notas: ''
    });
    setModalType('create');

    // Cargar datos necesarios para el formulario
    await Promise.all([loadClients(), loadServices()]);
  };

  const handleCancel = async (id) => {
    setCancelConfirm({ isOpen: true, appointmentId: id });
  };

  const confirmCancel = async () => {
    const { appointmentId } = cancelConfirm;
    try {
      await cancelAppointment(appointmentId);
      await loadAppointments();
      showSuccess('Cita cancelada exitosamente');
      setCancelConfirm({ isOpen: false, appointmentId: null });
    } catch (err) {
      showError(err.message || 'Error al cancelar la cita');
      setCancelConfirm({ isOpen: false, appointmentId: null });
    }
  };

  const handleSaveAppt = async () => {
    if (!selectedAppt) return;

    const isPastDate = selectedAppt.fecha < todayStr;

    if (modalType === 'create') {
      if (isPastDate) {
        showError('No puedes crear una cita en una fecha que ya pasó.');
        return;
      }

      // Mapear datos al formato del backend
      const selectedPet = pets.find(p => p.name === selectedAppt.mascota);
      if (!selectedPet) {
        showError('Debes seleccionar una mascota válida');
        return;
      }

      // Obtener el email del groomer seleccionado
      const selectedGroomer = groomers.find(g => g.nombre_completo === selectedAppt.groomer);
      const groomerEmail = selectedGroomer ? selectedGroomer.email : null;

      const appointmentData = {
        pet_id: selectedPet.id,
        service: selectedAppt.servicio,
        date: selectedAppt.fecha,
        time: selectedAppt.hora,
        notes: selectedAppt.notas || null,
        groomer_email: groomerEmail
      };

      try {
        await createAppointment(appointmentData);
        await loadAppointments();
        closeApptModal();
        showSuccess('Cita creada exitosamente');
      } catch (err) {
        showError(err.message || 'Error al crear la cita');
      }
    } else {
      if (!selectedAppt.estado) {
        showError('El estado de la cita no está definido.');
        return;
      }

      const fullyBlockedStates = ['Cancelada', 'Completada', 'En progreso'];
      if (fullyBlockedStates.includes(selectedAppt.estado)) {
        showError(`No se puede editar una cita que está ${selectedAppt.estado.toLowerCase()}.`);
        closeApptModal();
        return;
      }

      const protectedStates = ['En progreso', 'Completada'];
      if (protectedStates.includes(selectedAppt.estado)) {
        const original = appointments.find(a => a.id === selectedAppt.id);
        if (original && original.fecha !== selectedAppt.fecha) {
          showError('No se puede modificar la fecha de una cita que ya está en progreso o completada.');
          return;
        }
      }

      if (isPastDate) {
        const original = appointments.find(a => a.id === selectedAppt.id);
        if (!original || original.fecha !== selectedAppt.fecha) {
          showError('No puedes cambiar la fecha de una cita a un día que ya pasó.');
          return;
        }
      }

      // Mapear estado al formato del backend
      const statusMap = {
        'Pendiente': 'pending',
        'Confirmada': 'confirmed',
        'En progreso': 'in_progress',
        'Completada': 'completed',
        'Reagendada': 'confirmed',
        'Cancelada': 'cancelled'
      };

      const updateData = {
        date: selectedAppt.fecha,
        time: selectedAppt.hora,
        notes: selectedAppt.notas || null,
        status: statusMap[selectedAppt.estado] || 'pending'
      };

      try {
        await updateAppointment(selectedAppt.id, updateData);
        await loadAppointments();
        closeApptModal();
        showSuccess('Cita actualizada exitosamente');
      } catch (err) {
        showError(err.message || 'Error al actualizar la cita');
      }
    }
  };

  const closeApptModal = () => {
    setModalType(null);
    setSelectedAppt(null);
  };

  const handleApptFormChange = async (field, value) => {
    setSelectedAppt(prev => ({ ...prev, [field]: value }));

    // Cargar mascotas cuando se selecciona un cliente
    if (field === 'cliente' && modalType === 'create') {
      await loadPetsByClient(value);
      setSelectedAppt(prev => ({ ...prev, mascota: '', groomer: '' }));
    }

    // Cargar groomers cuando se selecciona un servicio
    if (field === 'servicio' && modalType === 'create') {
      await loadGroomersByService(value);
      setSelectedAppt(prev => ({ ...prev, groomer: '' }));
    }
  };

  return (
    <div className="admin-page">
      {/* Header Superior */}
      <div className="admin-page-header">
        <div className="admin-page-header__main">
          <div className="admin-page-header__title">
            <h1>Citas</h1>
          </div>
          <p className="admin-page-header__subtitle">
            Gestiona todas las reservas y servicios del sistema.
          </p>
          <div className="admin-page-header__actions">
            <button onClick={handleCreateNew} className="btn-primary">+ Crear Cita</button>
          </div>
        </div>
      </div>

      {loading && (
        <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
          Cargando citas...
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
          {error} — <button onClick={loadAppointments} style={{ color: '#b91c1c', textDecoration: 'underline' }}>Reintentar</button>
        </div>
      )}

      {/* Vista Agenda */}
      <div style={{ marginTop: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '20px' }}>
            Vista Agenda
            <span style={{ fontSize: '14px', color: '#888', marginLeft: '10px', fontWeight: 'normal' }}>
              {appointments.length} citas
            </span>
          </h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="filter-btn active">Hoy</button>
            <button className="filter-btn">Mañana</button>
            <button className="filter-btn">Esta Semana</button>
          </div>
        </div>

        {/* Agenda List */}
        <div className="usuarios-table-wrapper">
          <table className="usuarios-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Hora</th>
                <th>Cliente</th>
                <th>Mascota</th>
                <th>Servicio</th>
                <th>Groomer</th>
                <th>Estado</th>
                <th>Notas</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((cita) => (
                <tr key={cita.id}>
                  <td>
                    {cita.fecha || '—'}
                    {cita.fecha && <div style={{ fontSize: '11px', color: '#888' }}>{getDayName(cita.fecha)}</div>}
                  </td>
                  <td><strong>{cita.hora}</strong></td>
                  <td>{cita.cliente}</td>
                  <td>{cita.mascota}</td>
                  <td>{cita.servicio}</td>
                  <td>{cita.groomer}</td>
                  <td>
                    <span className={`status-badge ${(cita.estado || 'desconocido').toLowerCase().replace(' ', '')}`}>
                      {cita.estado || 'Sin estado'}
                    </span>
                  </td>
                  <td style={{ maxWidth: '180px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={cita.notas || ''}>
                    {cita.notas ? cita.notas.substring(0, 35) + (cita.notas.length > 35 ? '...' : '') : '—'}
                  </td>
                  <td className="actions-cell">
                    <button type="button" onClick={() => handleView(cita)} title="Ver detalle">👁</button>
                    
                    {cita.estado && !['Cancelada', 'Completada', 'En progreso'].includes(cita.estado) && (
                      <button 
                        type="button" 
                        onClick={() => handleEdit(cita)} 
                        title="Editar"
                      >
                        ✏️
                      </button>
                    )}

                    {cita.estado && cita.estado !== 'Cancelada' && (
                      <button 
                        type="button" 
                        onClick={() => handleCancel(cita.id)} 
                        title="Cancelar cita" 
                        className="danger"
                      >
                        ✕
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: '12px', color: '#888', fontSize: '13px' }}>
          Mostrando citas de hoy • Datos cargados desde base de datos
        </div>
      </div>

      {/* MODALES PARA CITAS */}
      {modalType && selectedAppt && (
        <div className="modal-overlay" onClick={closeApptModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3>
                {modalType === 'view' && 'Detalle de la Cita'}
                {modalType === 'edit' && 'Editar Cita'}
                {modalType === 'create' && 'Nueva Cita'}
              </h3>
              <button onClick={closeApptModal} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>×</button>
            </div>

            {modalType === 'view' && (
              <div>
                <p>
                  <strong>Fecha:</strong> {selectedAppt.fecha || '—'}
                  {selectedAppt.fecha && <span style={{ color: '#888', marginLeft: '8px' }}>({getDayName(selectedAppt.fecha)})</span>}
                </p>
                <p><strong>Hora:</strong> {selectedAppt.hora}</p>
                <p><strong>Cliente:</strong> {selectedAppt.cliente}</p>
                <p><strong>Mascota:</strong> {selectedAppt.mascota}</p>
                <p><strong>Servicio:</strong> {selectedAppt.servicio}</p>
                <p><strong>Groomer:</strong> {selectedAppt.groomer}</p>
                <p><strong>Estado:</strong> {selectedAppt.estado || 'Sin estado'}</p>
                {selectedAppt.notas && (
                  <div style={{ marginTop: '12px', padding: '10px', background: '#1f1f1f', borderRadius: '6px' }}>
                    <strong style={{ display: 'block', marginBottom: '4px' }}>Notas adicionales:</strong>
                    <span style={{ color: '#ccc' }}>{selectedAppt.notas}</span>
                  </div>
                )}
              </div>
            )}

            {(modalType === 'edit' || modalType === 'create') && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {/* Hora */}
                  <div style={{ marginBottom: '12px' }}>
                    <label>Hora</label>
                    <input
                      value={selectedAppt.hora}
                      onChange={e => handleApptFormChange('hora', e.target.value)}
                      type="time"
                      style={{ width: '100%', padding: '10px' }}
                    />
                  </div>

                  {/* Estado */}
                  <div style={{ marginBottom: '12px' }}>
                    <label>Estado</label>
                    <select
                      value={selectedAppt.estado || 'Pendiente'}
                      onChange={e => handleApptFormChange('estado', e.target.value)}
                      style={{ width: '100%', padding: '10px' }}
                    >
                      <option value="Pendiente">Pendiente</option>
                      <option value="Confirmada">Confirmada</option>
                      <option value="En progreso">En progreso</option>
                      <option value="Completada">Completada</option>
                      <option value="Reagendada">Reagendada</option>
                      <option value="Cancelada">Cancelada</option>
                    </select>
                  </div>

                  {/* Cliente con autocompletado */}
                  <div style={{ marginBottom: '12px' }}>
                    <label>Cliente</label>
                    {modalType === 'create' ? (
                      <input
                        list="clients-list"
                        value={selectedAppt.cliente}
                        onChange={e => handleApptFormChange('cliente', e.target.value)}
                        placeholder="Buscar cliente..."
                        style={{ width: '100%', padding: '10px' }}
                      />
                    ) : (
                      <input
                        value={selectedAppt.cliente}
                        onChange={e => handleApptFormChange('cliente', e.target.value)}
                        style={{ width: '100%', padding: '10px' }}
                      />
                    )}
                    {modalType === 'create' && (
                      <datalist id="clients-list">
                        {clients.map(c => (
                          <option key={c.email} value={c.email}>
                            {c.nombre_completo}
                          </option>
                        ))}
                      </datalist>
                    )}
                  </div>

                  {/* Mascota */}
                  <div style={{ marginBottom: '12px' }}>
                    <label>Mascota</label>
                    {modalType === 'create' ? (
                      <select
                        value={selectedAppt.mascota}
                        onChange={e => handleApptFormChange('mascota', e.target.value)}
                        style={{ width: '100%', padding: '10px' }}
                        disabled={!selectedAppt.cliente}
                      >
                        <option value="">Seleccionar mascota...</option>
                        {pets.map(p => (
                          <option key={p.id} value={p.name}>
                            {p.name} ({p.breed || 'Sin raza'})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        value={selectedAppt.mascota}
                        onChange={e => handleApptFormChange('mascota', e.target.value)}
                        style={{ width: '100%', padding: '10px' }}
                      />
                    )}
                  </div>

                  {/* Servicio */}
                  <div style={{ gridColumn: '1 / -1', marginBottom: '12px' }}>
                    <label>Servicio</label>
                    {modalType === 'create' ? (
                      <select
                        value={selectedAppt.servicio}
                        onChange={e => handleApptFormChange('servicio', e.target.value)}
                        style={{ width: '100%', padding: '10px' }}
                      >
                        <option value="">Seleccionar servicio...</option>
                        {services.map(s => (
                          <option key={s.id} value={s.name}>
                            {s.name} - ${s.base_price} ({s.category})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        value={selectedAppt.servicio}
                        onChange={e => handleApptFormChange('servicio', e.target.value)}
                        style={{ width: '100%', padding: '10px' }}
                      />
                    )}
                  </div>

                  {/* Groomer */}
                  <div style={{ gridColumn: '1 / -1', marginBottom: '12px' }}>
                    <label>Groomer</label>
                    {modalType === 'create' ? (
                      <select
                        value={selectedAppt.groomer}
                        onChange={e => handleApptFormChange('groomer', e.target.value)}
                        style={{ width: '100%', padding: '10px' }}
                        disabled={!selectedAppt.servicio}
                      >
                        <option value="">Seleccionar groomer...</option>
                        {groomers.map(g => (
                          <option key={g.id} value={g.nombre_completo}>
                            {g.nombre_completo} - {g.rating > 0 ? g.rating : 'Sin calificar'} ⭐
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        value={selectedAppt.groomer}
                        onChange={e => handleApptFormChange('groomer', e.target.value)}
                        style={{ width: '100%', padding: '10px' }}
                      />
                    )}
                  </div>

                  {/* Fecha */}
                  <div style={{ gridColumn: '1 / -1', marginBottom: '12px' }}>
                    <label>Fecha</label>

                    {selectedAppt.estado && ['En progreso', 'Completada'].includes(selectedAppt.estado) ? (
                      <div>
                        <input
                          type="date"
                          value={selectedAppt.fecha || ''}
                          disabled
                          style={{ width: '100%', padding: '10px', background: '#222', color: '#888' }}
                        />
                        <div style={{ fontSize: '12px', color: '#f87171', marginTop: '4px' }}>
                          No se puede modificar la fecha de citas en {selectedAppt.estado.toLowerCase()}.
                        </div>
                      </div>
                    ) : (
                      <>
                        <input
                          type="date"
                          value={selectedAppt.fecha || ''}
                          onChange={e => handleApptFormChange('fecha', e.target.value)}
                          min={todayStr}
                          style={{ width: '100%', padding: '10px' }}
                        />
                        {selectedAppt.fecha && (
                          <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
                            {getDayName(selectedAppt.fecha)}
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Notas adicionales */}
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label>Notas adicionales</label>
                    <textarea
                      value={selectedAppt.notas || ''}
                      onChange={e => handleApptFormChange('notas', e.target.value)}
                      rows={2}
                      style={{ width: '100%', padding: '10px', resize: 'vertical' }}
                    />
                  </div>
                </div>
              </div>
            )}

            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={closeApptModal}>Cancelar</button>
              {(modalType === 'edit' || modalType === 'create') && (
                <button onClick={handleSaveAppt} className="btn-primary">
                  {modalType === 'create' ? 'Crear cita' : 'Guardar cambios'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      <ModalDialog
        isOpen={cancelConfirm.isOpen}
        onClose={() => setCancelConfirm({ isOpen: false, appointmentId: null })}
        title="Confirmar cancelación"
        actions={[
          { label: 'Cancelar', variant: 'secondary', onClick: () => setCancelConfirm({ isOpen: false, appointmentId: null }) },
          { label: 'Confirmar', variant: 'danger', onClick: confirmCancel }
        ]}
      >
        <p>¿Estás seguro de marcar esta cita como cancelada?</p>
      </ModalDialog>
    </div>
  );
};

export default AdminAppointmentsPage;
