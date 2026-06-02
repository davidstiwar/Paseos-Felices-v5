import React, { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const ApplicationDetail = ({ 
  application, 
  onBack, 
  onApprove, 
  onReject, 
  canModify 
}) => {
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  const handleRejectSubmit = (e) => {
    e.preventDefault();
    onReject(rejectionReason);
    setRejectionReason('');
    setShowRejectForm(false);
  };

  return (
    <div className="application-detail">
      <div className="detail-header">
        <button className="btn-back" onClick={onBack}>
          ← Volver
        </button>
        <h2>Detalles de Solicitud</h2>
        <div className="status-badge" data-status={application.status}>
          {application.status === 'pending' && '📋 Pendiente'}
          {application.status === 'approved' && '✅ Aprobada'}
          {application.status === 'rejected' && '❌ Rechazada'}
        </div>
      </div>

      <div className="detail-content">
        {/* Foto Profesional */}
        <div className="detail-section">
          <h3>Foto Profesional</h3>
          {application.foto_url && application.foto_url.startsWith('data:') ? (
            <img 
              src={application.foto_url} 
              alt={application.nombre_completo}
              className="detail-photo"
            />
          ) : (
            <div className="photo-placeholder-large">👤</div>
          )}
        </div>

        {/* Información Personal */}
        <div className="detail-section">
          <h3>Información Personal</h3>
          <div className="detail-grid">
            <div className="detail-item">
              <label>Nombre Completo</label>
              <p>{application.nombre_completo}</p>
            </div>
            <div className="detail-item">
              <label>Email</label>
              <p>{application.email}</p>
            </div>
            <div className="detail-item">
              <label>Teléfono</label>
              <p>{application.telefono}</p>
            </div>
            <div className="detail-item">
              <label>Fecha de Nacimiento</label>
              <p>
                {format(new Date(application.fecha_nacimiento), 'dd/MMMM/yyyy', { locale: es })}
              </p>
            </div>
            <div className="detail-item">
              <label>Ciudad</label>
              <p>{application.ciudad}</p>
            </div>
            <div className="detail-item">
              <label>Dirección</label>
              <p>{application.direccion}</p>
            </div>
          </div>
        </div>

        {/* Sobre El Groomer */}
        <div className="detail-section">
          <h3>Cuéntanos sobre ti</h3>
          <div className="about-me-box">
            {application.about_me}
          </div>
        </div>

        {/* Información de Revisión */}
        <div className="detail-section">
          <h3>Información de Revisión</h3>
          <div className="detail-grid">
            <div className="detail-item">
              <label>Fecha de Solicitud</label>
              <p>
                {format(new Date(application.created_at), 'dd/MMM/yyyy HH:mm', { locale: es })}
              </p>
            </div>
            {application.reviewed_at && (
              <>
                <div className="detail-item">
                  <label>Fecha de Revisión</label>
                  <p>
                    {format(new Date(application.reviewed_at), 'dd/MMM/yyyy HH:mm', { locale: es })}
                  </p>
                </div>
              </>
            )}
            {application.rejection_reason && (
              <div className="detail-item full-width">
                <label>Razón de Rechazo</label>
                <p className="rejection-reason">{application.rejection_reason}</p>
              </div>
            )}
          </div>
        </div>

        {/* Acciones */}
        {canModify && (
          <div className="detail-actions">
            <button 
              className="btn-approve"
              onClick={onApprove}
            >
              ✅ Aprobar Solicitud
            </button>
            <button 
              className="btn-reject"
              onClick={() => setShowRejectForm(!showRejectForm)}
            >
              ❌ Rechazar Solicitud
            </button>
          </div>
        )}

        {/* Formulario de Rechazo */}
        {showRejectForm && canModify && (
          <form className="reject-form" onSubmit={handleRejectSubmit}>
            <h4>Razón de Rechazo</h4>
            <textarea 
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Describe brevemente por qué está rechazando esta solicitud..."
              required
              rows="4"
            />
            <div className="form-actions">
              <button type="submit" className="btn-confirm">
                Confirmar Rechazo
              </button>
              <button 
                type="button"
                className="btn-cancel"
                onClick={() => setShowRejectForm(false)}
              >
                Cancelar
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ApplicationDetail;
