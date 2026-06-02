import React from 'react';

/**
 * NotificationCard (unificado)
 */
export default function NotificationCard({ notification, onDismiss, onRead, className = '' }) {
  if (!notification) return null;

  return (
    <div className={[`notification-card notification-${notification.type || 'info'}`, className].join(' ')}>
      <div className="notification-icon">{notification.icon}</div>
      <div className="notification-content">
        <p className="notification-message">{notification.message}</p>
        {notification.time ? <span className="notification-time">{notification.time}</span> : null}
      </div>
      {onRead ? (
        <button className="notification-close" type="button" onClick={() => onRead(notification)}>
          ✓
        </button>
      ) : null}
      {onDismiss ? (
        <button
          className="notification-close"
          type="button"
          onClick={() => onDismiss(notification.id)}
          title="Descartar"
        >
          ✕
        </button>
      ) : null}
    </div>
  );
}

