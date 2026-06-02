import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Manejar errores de promesas no capturadas de extensiones del navegador
window.addEventListener('unhandledrejection', (event) => {
  // Ignorar errores de comunicación entre pestañas de extensiones
  if (event.reason?.message?.includes('No Listener') || 
      event.reason?.message?.includes('tabs:outgoing.message')) {
    event.preventDefault();
    console.debug('[IGNORED] Browser extension message error:', event.reason);
  }
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
