import React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const ApplicationList = ({ applications, loading, onSelectApp }) => {
  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Cargando solicitudes...</p>
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📭</div>
        <h3>No hay solicitudes</h3>
        <p>No hay solicitudes en este estado por el momento</p>
      </div>
    );
  }

  return (
    <div className="applications-list">
      <table className="applications-table">
        <thead>
          <tr>
            <th>Foto</th>
            <th>Nombre</th>
            <th>Email</th>
            <th>Ciudad</th>
            <th>Teléfono</th>
            <th>Fecha de solicitud</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {applications.map(app => (
            <tr key={app.id} className="application-row">
              <td className="foto-cell">
                {app.foto_url && app.foto_url.startsWith('data:') ? (
                  <img src={app.foto_url} alt={app.nombre_completo} className="app-photo" />
                ) : (
                  <div className="photo-placeholder">👤</div>
                )}
              </td>
              <td className="nombre-cell">{app.nombre_completo}</td>
              <td className="email-cell">{app.email}</td>
              <td className="ciudad-cell">{app.ciudad}</td>
              <td className="telefono-cell">{app.telefono}</td>
              <td className="fecha-cell">
                {format(new Date(app.created_at), 'dd/MMM/yyyy', { locale: es })}
              </td>
              <td className="acciones-cell">
                <button 
                  className="btn-view"
                  onClick={() => onSelectApp(app.id)}
                  title="Ver detalles"
                >
                  👁️ Ver
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ApplicationList;
