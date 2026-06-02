import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { googleOAuthCallback } from '../../api/auth';
import { useUser } from '../../components/Context/UserContext';

const GoogleCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { saveSession } = useUser();

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      
      if (!code) {
        console.error('No code found in callback');
        navigate('/login?error=no_code');
        return;
      }

      try {
        // Intercambiar el código por un token
        const response = await googleOAuthCallback(code);
        
        // Guardar la sesión con token y usuario
        saveSession(response.access_token, response.user, response.user.role);
        
        // Redirigir al dashboard según el rol
        if (response.user.role === 'admin') {
          navigate('/admin');
        } else if (response.user.role === 'groomer') {
          navigate('/groomer');
        } else {
          navigate('/client');
        }
      } catch (error) {
        console.error('Error en callback de Google:', error);
        navigate('/login?error=oauth_failed');
      }
    };

    handleCallback();
  }, [searchParams, navigate, saveSession]);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <div style={{
        background: 'white',
        padding: '40px',
        borderRadius: '12px',
        textAlign: 'center',
        boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ margin: '0 0 16px 0', color: '#333' }}>
          Procesando autenticación...
        </h2>
        <p style={{ color: '#666' }}>
          Estamos verificando tu cuenta con Google
        </p>
      </div>
    </div>
  );
};

export default GoogleCallback;
