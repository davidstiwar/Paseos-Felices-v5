import React from 'react';

const NextAppointmentCard = ({ appointment }) => {
  if (!appointment) {
    return (
      <div className="card next-appointment-card">
        <p>No tienes citas programadas.</p>
      </div>
    );
  }

  return (
    <div className="card next-appointment-card">
      <div className="appointment-info">
        <div><strong>Mascota:</strong> {appointment.pet}</div>
        <div><strong>Servicio:</strong> {appointment.service}</div>
        <div><strong>Fecha:</strong> {appointment.date}</div>
        <div><strong>Hora:</strong> {appointment.time}</div>
        <div><strong>Paseador/Groomer:</strong> {appointment.groomer}</div>
        <div className="price"><strong>Precio:</strong> ${appointment.price}</div>
      </div>
      <button className="btn-primary">Ver detalles</button>
    </div>
  );
};

export default NextAppointmentCard;
