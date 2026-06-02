import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useUser } from '../../../components/Context/UserContext';
import { API_BASE } from '../../../api/config';
import { 
  getGroomerApplications,
  getGroomerApplication,
  approveGroomerApplication,
  rejectGroomerApplication 
} from '../../../api/auth';
import '../../../estilos/admin/GroomerApplications.css';
import ApplicationDetail from './ApplicationDetail';
import ApplicationList from './ApplicationList';
import { useToast } from '../../../components/Context/ToastContext';
import ModalDialog from '../../../components/Common/ModalDialog';

const GroomerApplications = () => {
  const { token } = useUser();
  const { showError, showSuccess } = useToast();
  const [applications, setApplications] = useState([]);
  const wsRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeStatus, setActiveStatus] = useState('pending');
  const [selectedApp, setSelectedApp] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [approveConfirm, setApproveConfirm] = useState({ isOpen: false, appId: null });

  const loadApplications = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getGroomerApplications(token, activeStatus);
      setApplications(data);
    } catch (err) {
      setError(err.message || 'Error al cargar las solicitudes');
    } finally {
      setLoading(false);
    }
  }, [token, activeStatus]);

  useEffect(() => {
    loadApplications();
  }, [loadApplications, showSuccess]);

  // WebSocket: alerta en tiempo real cuando cambia el número de solicitudes pendientes
  useEffect(() => {
    if (!token) return;

    // Solo mantener el WS cuando estamos viendo "Pendientes" (para evitar ruido)
    if (activeStatus !== 'pending') return;

    const wsUrl = `${API_BASE.replace(/^http/, 'ws')}/auth/ws/groomer-applications?token=${encodeURIComponent(token)}`;
    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        // console.log('WS conectado');
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg?.type === 'pending_changed') {
            loadApplications();
          }
        } catch (e) {
          // ignore parse errors
        }
      };

      ws.onerror = () => {
        // noop
      };

      ws.onclose = () => {
        wsRef.current = null;
      };
    } catch (e) {
      // noop
    }

    return () => {
      try {
        if (wsRef.current) wsRef.current.close();
      } catch (e) {
        // noop
      }
      wsRef.current = null;
    };
  }, [token, activeStatus, loadApplications, showSuccess]);

  const handleViewDetail = async (appId) => {
    try {
      const data = await getGroomerApplication(token, appId);
      setSelectedApp(data);
      setShowDetail(true);
    } catch (err) {
      setError(err.message || 'Error al cargar la solicitud');
    }
  };

  const handleApprove = async (appId) => {
    setApproveConfirm({ isOpen: true, appId });
  };

  const confirmApprove = async () => {
    const { appId } = approveConfirm;
    try {
      await approveGroomerApplication(token, appId);
      setError('');
      showSuccess('Solicitud aprobada. El groomer ahora puede acceder al sistema.');
      loadApplications();
      setShowDetail(false);
      setApproveConfirm({ isOpen: false, appId: null });
    } catch (err) {
      setError(err.message || 'Error al aprobar la solicitud');
      setApproveConfirm({ isOpen: false, appId: null });
    }
  };

  const handleReject = async (appId, reason) => {
    if (!reason.trim()) {
      showError('Por favor ingrese una razón de rechazo');
      return;
    }
    try {
      await rejectGroomerApplication(token, appId, reason);
      setError('');
      showSuccess('Solicitud rechazada.');
      loadApplications();
      setShowDetail(false);
    } catch (err) {
      setError(err.message || 'Error al rechazar la solicitud');
    }
  };

  return (
    <div className="groomer-applications-container">
      <div className="groomer-apps-header">
        <h1>Solicitudes de Groomers</h1>
        <p>Revisa y gestiona las solicitudes de registro de groomers</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="groomer-apps-tabs">
        <button 
          className={`tab-btn ${activeStatus === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveStatus('pending')}
        >
          📋 Pendientes
        </button>
        <button 
          className={`tab-btn ${activeStatus === 'approved' ? 'active' : ''}`}
          onClick={() => setActiveStatus('approved')}
        >
          ✅ Aprobadas
        </button>
        <button 
          className={`tab-btn ${activeStatus === 'rejected' ? 'active' : ''}`}
          onClick={() => setActiveStatus('rejected')}
        >
          ❌ Rechazadas
        </button>
      </div>

      <div className="groomer-apps-content">
        {showDetail && selectedApp ? (
          <ApplicationDetail 
            application={selectedApp}
            onBack={() => {
              setShowDetail(false);
              setSelectedApp(null);
            }}
            onApprove={() => handleApprove(selectedApp.id)}
            onReject={(reason) => handleReject(selectedApp.id, reason)}
            canModify={activeStatus === 'pending'}
          />
        ) : (
          <ApplicationList 
            applications={applications}
            loading={loading}
            onSelectApp={handleViewDetail}
          />
        )}
      </div>
      <ModalDialog
        isOpen={approveConfirm.isOpen}
        onClose={() => setApproveConfirm({ isOpen: false, appId: null })}
        title="Confirmar aprobación"
        actions={[
          { label: 'Cancelar', variant: 'secondary', onClick: () => setApproveConfirm({ isOpen: false, appId: null }) },
          { label: 'Aprobar', variant: 'primary', onClick: confirmApprove }
        ]}
      >
        <p>¿Está seguro de que desea aprobar esta solicitud? El groomer podrá acceder al sistema.</p>
      </ModalDialog>
    </div>
  );
};

export default GroomerApplications;
