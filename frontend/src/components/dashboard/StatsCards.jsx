import React from 'react';

const StatsCards = ({ stats }) => {
  return (
    <div className="dashboard-grid">
      <div className="card stat-card">
        <h3>Mis Mascotas</h3>
        <div className="stat-number">{stats.totalPets}</div>
        <p>Registradas</p>
      </div>
      <div className="card stat-card">
        <h3>Próxima Cita</h3>
        <div className="stat-number">{stats.nextAppointment}</div>
        <p>Fecha programada</p>
      </div>
      <div className="card stat-card">
        <h3>Servicios Realizados</h3>
        <div className="stat-number">{stats.completedServices}</div>
        <p>Este mes</p>
      </div>
      <div className="card stat-card">
        <h3>Citas Pendientes</h3>
        <div className="stat-number">{stats.pendingAppointments}</div>
        <p>Por confirmar</p>
      </div>
    </div>
  );
};

export default StatsCards;
