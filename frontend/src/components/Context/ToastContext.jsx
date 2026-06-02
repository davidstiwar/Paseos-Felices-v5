import React, { createContext, useContext, useState } from 'react';

// Exportamos el contexto para que componentes como ToastContainer puedan leerlo
// sin forzar el uso del hook `useToast()` (que lanza error si no hay provider).
export const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const makeToastId = () => {
    try {
      // Evita colisiones cuando se disparan varios toasts en el mismo milisegundo
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

  return (
    <ToastContext.Provider value={{ showToast, showSuccess, showError, removeToast, toasts }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
