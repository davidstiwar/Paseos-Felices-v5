import React, { useState } from 'react';
import { useUser } from '../Context/UserContext';
import { diagnostics } from '../../api/diagnostics';

/**
 * SessionDebugger: Componente de debugging para verificar estado de sesión
 * Solo visible en desarrollo (NODE_ENV === 'development')
 */
export const SessionDebugger = () => {
  const { user, token, userRole, isAuthenticated } = useUser();
  const [diagnosticInfo, setDiagnosticInfo] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  // Solo mostrar en desarrollo
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const handleCheckDiagnostics = async () => {
    const info = await diagnostics.checkSession();
    setDiagnosticInfo(info);
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: 10,
      left: 10,
      zIndex: 9999,
      fontFamily: 'monospace',
    }}>
      <button
        onClick={() => setIsVisible(!isVisible)}
        style={{
          padding: '8px 12px',
          background: '#333',
          color: '#0f0',
          border: '1px solid #0f0',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '12px',
        }}
      >
        🔍 {isVisible ? 'Ocultar' : 'Debug'}
      </button>

      {isVisible && (
        <div style={{
          background: '#1a1a1a',
          color: '#0f0',
          border: '1px solid #0f0',
          borderRadius: '4px',
          padding: '12px',
          marginTop: '8px',
          fontSize: '11px',
          maxWidth: '400px',
          maxHeight: '500px',
          overflow: 'auto',
        }}>
          <div>
            <strong>Session Info:</strong>
            <div>Authenticated: {isAuthenticated ? '✅' : '❌'}</div>
            <div>Token: {token ? '✅ Present' : '❌ Missing'}</div>
            <div>Role: {userRole || 'None'}</div>
            <div>User: {user?.email || 'Not loaded'}</div>
          </div>

          <hr style={{ borderColor: '#0f0' }} />

          <button
            onClick={handleCheckDiagnostics}
            style={{
              padding: '4px 8px',
              background: '#0f0',
              color: '#000',
              border: 'none',
              borderRadius: '2px',
              cursor: 'pointer',
              fontSize: '10px',
              width: '100%',
              marginBottom: '8px',
            }}
          >
            Check Services
          </button>

          {diagnosticInfo && (
            <div>
              <strong>Services:</strong>
              {Object.entries(diagnosticInfo.services).map(([name, status]) => (
                <div key={name}>
                  {name}: {status.ok ? '✅' : '❌'} {status.error && `(${status.error})`}
                </div>
              ))}

              <strong style={{ display: 'block', marginTop: '8px' }}>Token:</strong>
              {diagnosticInfo.tokenValid?.valid ? (
                <div>✅ Valid</div>
              ) : (
                <div>❌ {diagnosticInfo.tokenValid?.reason}</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SessionDebugger;
