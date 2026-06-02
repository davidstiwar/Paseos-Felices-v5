import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyAppointments, cancelAppointment } from '../../../api/appointments';
import { useToast } from '../../../components/Context/ToastContext';
import ModalDialog from '../../../components/Common/ModalDialog';

const MyAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { showError, showSuccess } = useToast();
  const [cancelConfirm, setCancelConfirm] = useState({ isOpen: false, appointmentId: null });

  const loadAppointments = useCallback(async () => {
    try {
      const data = await getMyAppointments();
      setAppointments(data);
    } catch (err) {
      console.error(err);
      showError(err.message || 'Error al cargar las citas');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  const handleCancel = async (id) => {
    setCancelConfirm({ isOpen: true, appointmentId: id });
  };

  const confirmCancel = async () => {
    const { appointmentId } = cancelConfirm;
    try {
      await cancelAppointment(appointmentId);
      showSuccess('Cita cancelada');
      loadAppointments(); // recargar
      setCancelConfirm({ isOpen: false, appointmentId: null });
    } catch (err) {
      showError(err.message || 'Error al cancelar la cita');
      setCancelConfirm({ isOpen: false, appointmentId: null });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return '#22c55e';
      case 'completed': return '#3b82f6';
      case 'cancelled': return '#ef4444';
      default: return '#f59e0b'; // pending
    }
  };

  if (loading) {
    return <div className="my-appointments"><p>Cargando tus citas...</p></div>;
  }

  return (
    <div className="my-appointments">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1>📅 Mis Citas</h1>
          <p>Visualiza y gestiona tus citas programadas</p>
          <p style={{ marginTop: '6px', color: '#666' }}>
            Al agendar una cita se genera una factura. El pago es presencial y en efectivo.
            Puedes verlas en <strong>Facturas</strong>.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            className="btn-secondary"
            onClick={() => navigate('/client/invoices')}
          >
            🧾 Ver Facturas
          </button>
          <button
            className="btn btn-primary"
            onClick={() => navigate('/client/book')}
          >
            + Agendar Nueva Cita
          </button>
        </div>
      </div>

      {appointments.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', background: 'var(--bg-card, #f8f9fa)', borderRadius: '12px' }}>
          <p>No tienes citas agendadas aún.</p>
          <button className="btn btn-primary" onClick={() => navigate('/client/book')}>
            Agendar mi primera cita
          </button>
        </div>
      ) : (
        <div className="appointments-list">
          {appointments.map((appt) => (
            <div key={appt.id} className="appointment-card">
              <div className="appointment-info">
                <div className="appointment-date">
                  {appt.service}
                  <span
                    className={`appointment-status status-${appt.status}`}
                    style={{ color: getStatusColor(appt.status) }}
                  >
                    {appt.status}
                  </span>
                </div>
                <div className="appointment-details">
                  <div>{appt.date} • {appt.time}</div>
                  <div style={{ marginTop: '8px' }}>
                    <strong>Mascota ID:</strong> {appt.pet_id} &nbsp;&nbsp;
                    <strong>Precio:</strong> ${appt.price || '-'}
                  </div>
                  {appt.notes && (
                    <div style={{ marginTop: '8px' }}>
                      <strong>Notas:</strong> {appt.notes}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginLeft: '20px' }}>
                {appt.status !== 'cancelled' && appt.status !== 'completed' && (
                  <>
                    <button 
                      className="btn-secondary"
                      onClick={() => navigate(`/client/appointments/edit/${appt.id}`)}
                    >
                      Editar
                    </button>
                    <button 
                      className="btn-secondary" 
                      style={{ color: '#dc2626', borderColor: '#fecaca' }}
                      onClick={() => handleCancel(appt.id)}
                    >
                      Cancelar
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
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
        <p>¿Estás seguro de que quieres cancelar esta cita?</p>
      </ModalDialog>
    </div>
  );
};

export default MyAppointments;
