import React from 'react';

const NotificationsCard = ({ notifications }) => {
  return (
    <div className="card notifications-card">
      {notifications.length === 0 ? (
        <p>No tienes notificaciones nuevas.</p>
      ) : (
        notifications.map((notif) => (
          <div key={notif.id} className="notification-item">
            <span>{notif.message}</span>
            <small>{notif.time}</small>
          </div>
        ))
      )}
    </div>
  );
};

export default NotificationsCard;
