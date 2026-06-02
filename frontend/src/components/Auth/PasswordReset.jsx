import React, { useState } from 'react';
import { requestPasswordReset, confirmPasswordReset } from '../../api/auth';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function PasswordReset() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const isResetMode = !!token;

  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRequestReset = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const response = await requestPasswordReset(email);
      setMessage(response.message);
      if (response.reset_url) {
        console.log('Reset URL (solo desarrollo):', response.reset_url);
      }
    } catch (err) {
      setError(err.message || 'Error al solicitar recuperación de contraseña');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReset = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      setLoading(false);
      return;
    }

    try {
      const response = await confirmPasswordReset(token, newPassword);
      setMessage(response.message);
      
      // Redirigir al login después de 3 segundos
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError(err.message || 'Error al restablecer la contraseña');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      background: 'linear-gradient(135deg, #e07a5f 0%, #d4a373 100%)',
      position: 'relative'
    }}>
      {/* Decorative circles */}
      <div style={{
        position: 'absolute',
        width: '350px',
        height: '350px',
        borderRadius: '50%',
        background: 'rgba(224, 122, 95, 0.15)',
        top: '-120px',
        right: '-120px',
        filter: 'blur(80px)'
      }} />
      <div style={{
        position: 'absolute',
        width: '300px',
        height: '300px',
        borderRadius: '50%',
        background: 'rgba(224, 122, 95, 0.1)',
        bottom: '-100px',
        left: '-100px',
        filter: 'blur(70px)'
      }} />

      <div style={{
        background: 'white',
        borderRadius: '24px',
        padding: '52px',
        maxWidth: '450px',
        width: '100%',
        boxShadow: '0 25px 80px rgba(224, 122, 95, 0.2)',
        position: 'relative',
        zIndex: 1,
        border: '1px solid rgba(224, 122, 95, 0.1)'
      }}>
        {/* Icon */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: '28px'
        }}>
          <div style={{
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #e07a5f 0%, #d4a373 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 10px 30px rgba(224, 122, 95, 0.35)'
          }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15l-7-7-7 7"/>
              <path d="M21 3v6h-6"/>
              <path d="M3 21v-6h6"/>
              <path d="M3 9l7 7 7-7"/>
            </svg>
          </div>
        </div>

        <h1 style={{
          margin: '0 0 14px 0',
          fontSize: '34px',
          fontWeight: '700',
          color: '#2d2d2d',
          textAlign: 'center',
          letterSpacing: '-0.5px'
        }}>
          {isResetMode ? 'Restablecer Contraseña' : 'Recuperar Contraseña'}
        </h1>
        
        <p style={{
          margin: '0 0 36px 0',
          fontSize: '16px',
          color: '#666',
          textAlign: 'center',
          lineHeight: '1.7'
        }}>
          {isResetMode 
            ? 'Ingresa tu nueva contraseña para restablecer tu cuenta'
            : 'Ingresa tu email y te enviaremos instrucciones para recuperar tu contraseña'
          }
        </p>

        {error && (
          <div style={{
            background: 'rgba(224, 122, 95, 0.1)',
            color: '#c96a52',
            padding: '16px 18px',
            borderRadius: '14px',
            marginBottom: '28px',
            fontSize: '15px',
            border: '1px solid rgba(224, 122, 95, 0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {error}
          </div>
        )}

        {message && (
          <div style={{
            background: 'rgba(224, 122, 95, 0.1)',
            color: '#c96a52',
            padding: '16px 18px',
            borderRadius: '14px',
            marginBottom: '28px',
            fontSize: '15px',
            border: '1px solid rgba(224, 122, 95, 0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            {message}
          </div>
        )}

        {!isResetMode ? (
          <form onSubmit={handleRequestReset}>
            <div style={{ marginBottom: '28px' }}>
              <label style={{
                display: 'block',
                marginBottom: '10px',
                fontSize: '15px',
                fontWeight: '600',
                color: '#2d2d2d'
              }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="tu@email.com"
                style={{
                  width: '100%',
                  padding: '16px 18px',
                  border: '2px solid #e8e8e8',
                  borderRadius: '14px',
                  fontSize: '16px',
                  boxSizing: 'border-box',
                  outline: 'none',
                  transition: 'all 0.2s',
                  background: '#fafafa',
                  color: '#2d2d2d'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#e07a5f';
                  e.target.style.background = 'white';
                  e.target.style.boxShadow = '0 0 0 4px rgba(224, 122, 95, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e8e8e8';
                  e.target.style.background = '#fafafa';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '18px',
                background: loading ? '#999' : 'linear-gradient(135deg, #e07a5f 0%, #d4a373 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '14px',
                fontSize: '17px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s',
                boxShadow: loading ? 'none' : '0 6px 25px rgba(224, 122, 95, 0.35)'
              }}
              onMouseOver={(e) => {
                if (!loading) {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 8px 30px rgba(224, 122, 95, 0.45)';
                }
              }}
              onMouseOut={(e) => {
                if (!loading) {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 6px 25px rgba(224, 122, 95, 0.35)';
                }
              }}
            >
              {loading ? 'Enviando...' : 'Enviar Instrucciones'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleConfirmReset}>
            <div style={{ marginBottom: '28px' }}>
              <label style={{
                display: 'block',
                marginBottom: '10px',
                fontSize: '15px',
                fontWeight: '600',
                color: '#2d2d2d'
              }}>
                Nueva Contraseña
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '16px 18px',
                  border: '2px solid #e8e8e8',
                  borderRadius: '14px',
                  fontSize: '16px',
                  boxSizing: 'border-box',
                  outline: 'none',
                  transition: 'all 0.2s',
                  background: '#fafafa',
                  color: '#2d2d2d'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#e07a5f';
                  e.target.style.background = 'white';
                  e.target.style.boxShadow = '0 0 0 4px rgba(224, 122, 95, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e8e8e8';
                  e.target.style.background = '#fafafa';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            <div style={{ marginBottom: '28px' }}>
              <label style={{
                display: 'block',
                marginBottom: '10px',
                fontSize: '15px',
                fontWeight: '600',
                color: '#2d2d2d'
              }}>
                Confirmar Contraseña
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '16px 18px',
                  border: '2px solid #e8e8e8',
                  borderRadius: '14px',
                  fontSize: '16px',
                  boxSizing: 'border-box',
                  outline: 'none',
                  transition: 'all 0.2s',
                  background: '#fafafa',
                  color: '#2d2d2d'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#e07a5f';
                  e.target.style.background = 'white';
                  e.target.style.boxShadow = '0 0 0 4px rgba(224, 122, 95, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e8e8e8';
                  e.target.style.background = '#fafafa';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '18px',
                background: loading ? '#999' : 'linear-gradient(135deg, #e07a5f 0%, #d4a373 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '14px',
                fontSize: '17px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s',
                boxShadow: loading ? 'none' : '0 6px 25px rgba(224, 122, 95, 0.35)'
              }}
              onMouseOver={(e) => {
                if (!loading) {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 8px 30px rgba(224, 122, 95, 0.45)';
                }
              }}
              onMouseOut={(e) => {
                if (!loading) {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 6px 25px rgba(224, 122, 95, 0.35)';
                }
              }}
            >
              {loading ? 'Restableciendo...' : 'Restablecer Contraseña'}
            </button>
          </form>
        )}

        <button
          onClick={() => navigate('/login')}
          style={{
            marginTop: '28px',
            width: '100%',
            padding: '16px',
            background: 'transparent',
            color: '#e07a5f',
            border: '2px solid #e07a5f',
            borderRadius: '14px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => {
            e.target.style.background = 'rgba(224, 122, 95, 0.08)';
            e.target.style.transform = 'translateY(-1px)';
          }}
          onMouseOut={(e) => {
            e.target.style.background = 'transparent';
            e.target.style.transform = 'translateY(0)';
          }}
        >
          ← Volver al Login
        </button>
      </div>
    </div>
  );
}
