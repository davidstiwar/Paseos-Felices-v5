import React, { useContext, useEffect, useState } from 'react';
import './Toast.css';
import { ToastContext } from '../Context/ToastContext';

/**
 * Toast Notification System
 * Provides standardized notifications with green for success and red for errors
 */
export default function Toast({ message, type = 'success', duration = 3000, onClose }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for fade out animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!isVisible) return null;

  return (
    <div className={`toast toast-${type}`}>
      <div className="toast-content">
        <span className="toast-icon">
          {type === 'success' ? '✓' : '✕'}
        </span>
        <span className="toast-message">{message}</span>
      </div>
      <button className="toast-close" onClick={() => {
        setIsVisible(false);
        setTimeout(onClose, 300);
      }}>
        ✕
      </button>
    </div>
  );
}

/**
 * Toast Container for managing multiple toasts
 */
export function ToastContainer({ toasts, removeToast }) {
  // Permite usar <ToastContainer /> sin props (toma datos del ToastProvider),
  // y también soporta el modo controlado pasando `toasts`/`removeToast` como props.
  const toastCtx = useContext(ToastContext);
  const safeToasts = toasts ?? toastCtx?.toasts ?? [];
  const safeRemoveToast = removeToast ?? toastCtx?.removeToast ?? (() => {});

  return (
    <div className="toast-container">
      {safeToasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => safeRemoveToast(toast.id)}
        />
      ))}
    </div>
  );
}

/**
 * Hook for using Toast notifications
 */
export function useToast() {
  const [toasts, setToasts] = useState([]);

  const makeToastId = () => {
    try {
      return (crypto && crypto.randomUUID) ? crypto.randomUUID() : `${Date.now()}_${Math.random().toString(16).slice(2)}`;
    } catch {
      return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
    }
  };

  const showToast = (message, type = 'success', duration = 3000) => {
    const id = makeToastId();
    setToasts((prev) => [...prev, { id, message, type, duration }]);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const showSuccess = (message, duration) => showToast(message, 'success', duration);
  const showError = (message, duration) => showToast(message, 'error', duration);

  return {
    toasts,
    showToast,
    showSuccess,
    showError,
    removeToast,
    ToastContainer: () => <ToastContainer toasts={toasts} removeToast={removeToast} />
  };
}
