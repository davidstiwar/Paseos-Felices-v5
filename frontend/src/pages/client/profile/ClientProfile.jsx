import React, { useEffect, useState } from 'react';
import '../../../estilos/ClientPanel.css';

import { changePassword } from '../../../api/auth';
import { API_BASE } from '../../../api/config';
import { useUser } from '../../../components/Context/UserContext';
import { preloadImage, dataUrlToBlobUrl } from '../../../utils/imageUtils';
import ImageUpload from '../../../components/Common/ImageUpload';

const ClientProfile = () => {
  const { user: contextUser, token: authToken, updateUserData } = useUser();
  const [loadingProfile, setLoadingProfile] = useState(true);

  const [formData, setFormData] = useState({
    nombreCompleto: '',
    telefono: '',
    direccion: '',
    email: '',
    ciudad: '',
    fechaNacimiento: '',
    fotoUrl: '',
    aboutMe: '',
  });

  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });


  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [photoPreview, setPhotoPreview] = useState('');
  // Guardar si el preview actual viene de un object URL para poder revocar
  const [currentObjectUrl, setCurrentObjectUrl] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      setLoadingProfile(true);
      setMessage('');
      try {
        const token = authToken || localStorage.getItem('token');
        if (!token) throw new Error('No hay sesión activa');

        // Crear AbortController para timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundo timeout

        const res = await fetch(`${API_BASE}/auth/me`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.detail || 'Error al cargar perfil desde auth');
        }

        const profile = await res.json();
        if (cancelled) return;

        setFormData({
          nombreCompleto: profile.full_name || profile.nombre_completo || contextUser?.full_name || contextUser?.nombre_completo || '',
          telefono: profile.phone || profile.telefono || contextUser?.phone || contextUser?.telefono || '',
          direccion: profile.address || profile.direccion || profile.full_address || contextUser?.direccion || '',
          email: profile.email || contextUser?.email || '',
          ciudad: profile.city || profile.ciudad || contextUser?.ciudad || '',
          fechaNacimiento: profile.fecha_nacimiento || profile.fechaNacimiento || contextUser?.fecha_nacimiento || '',
          fotoUrl: profile.profile_picture_url || profile.foto_url || contextUser?.foto_url || '',
          aboutMe: profile.bio || profile.about_me || profile.aboutMe || contextUser?.about_me || '',
        });
        // Precargar antes de mostrar para evitar <img> roto en el DOM
        (async () => {
          let candidate = profile.profile_picture_url || profile.foto_url || contextUser?.foto_url || '';
          if (!candidate) {
            setPhotoPreview('');
            return;
          }

          // Si es una data URL muy grande o base64, convertir a object URL para evitar ERR_INVALID_URL
          let previewCandidate = candidate;
          if (candidate.startsWith('data:')) {
            const blobUrl = dataUrlToBlobUrl(candidate);
            if (blobUrl) previewCandidate = blobUrl;
          }

          if (previewCandidate && await preloadImage(previewCandidate)) {
            // Revocar previo si existía
            if (currentObjectUrl && currentObjectUrl !== previewCandidate) {
              try { URL.revokeObjectURL(currentObjectUrl); } catch {}
              setCurrentObjectUrl(null);
            }

            setPhotoPreview(previewCandidate);
            if (previewCandidate.startsWith('blob:')) setCurrentObjectUrl(previewCandidate);
          } else {
            setPhotoPreview('');
          }
        })();
      } catch (err) {
        if (cancelled) return;
        
        // Manejo mejorado de errores
        const errorMessage = err?.message || (err?.name === 'AbortError' ? 'Tiempo de espera agotado' : 'Error al cargar el perfil');
        console.error('Profile loading error:', { error: err, message: errorMessage });
        
        // Si fallamos, al menos mostrar datos del contexto
        if (contextUser) {
          setFormData({
            nombreCompleto: contextUser.full_name || contextUser.nombre_completo || '',
            telefono: contextUser.phone || contextUser.telefono || '',
            direccion: contextUser.direccion || '',
            email: contextUser.email || '',
            ciudad: contextUser.ciudad || '',
            fechaNacimiento: contextUser.fecha_nacimiento || '',
            fotoUrl: contextUser.foto_url || '',
            aboutMe: contextUser.about_me || '',
          });
          (async () => {
            const candidate = contextUser.foto_url || '';
            if (!candidate) {
              setPhotoPreview('');
              return;
            }
            let previewCandidate = candidate;
            if (candidate.startsWith('data:')) {
              const blobUrl = dataUrlToBlobUrl(candidate);
              if (blobUrl) previewCandidate = blobUrl;
            }

            if (previewCandidate && await preloadImage(previewCandidate)) {
              if (currentObjectUrl && currentObjectUrl !== previewCandidate) {
                try { URL.revokeObjectURL(currentObjectUrl); } catch {}
                setCurrentObjectUrl(null);
              }
              setPhotoPreview(previewCandidate);
              if (previewCandidate.startsWith('blob:')) setCurrentObjectUrl(previewCandidate);
            } else {
              setPhotoPreview('');
            }
          })();
          setMessage('⚠️ Cargando datos locales. ' + errorMessage);
        } else {
          setMessage('❌ ' + errorMessage);
        }
      } finally {
        if (!cancelled) setLoadingProfile(false);
      }
    }

    loadProfile();
    return () => {
      cancelled = true;
    };
  }, [contextUser, authToken, currentObjectUrl]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoChange = async (url) => {
    setFormData(prev => ({ ...prev, fotoUrl: url }));
    // Precargar la imagen subida antes de mostrarla
    try {
      let previewCandidate = url;
      if (url && typeof url === 'string' && url.startsWith('data:')) {
        const blobUrl = dataUrlToBlobUrl(url);
        if (blobUrl) previewCandidate = blobUrl;
      }

      if (previewCandidate && await preloadImage(previewCandidate)) {
        // Revocar previo si existía
        if (currentObjectUrl && currentObjectUrl !== previewCandidate) {
          try { URL.revokeObjectURL(currentObjectUrl); } catch {}
          setCurrentObjectUrl(null);
        }
        setPhotoPreview(previewCandidate);
        if (previewCandidate.startsWith('blob:')) setCurrentObjectUrl(previewCandidate);
      } else {
        setPhotoPreview('');
        setMessage('⚠️ La imagen subida no está disponible para vista previa');
        setTimeout(() => setMessage(''), 4000);
      }
    } catch (e) {
      console.warn('handlePhotoChange conversion failed', e);
      setPhotoPreview('');
    }
  };

  // Revocar cualquier object URL al desmontar o cuando cambie
  useEffect(() => {
    return () => {
      try {
        if (currentObjectUrl) URL.revokeObjectURL(currentObjectUrl);
      } catch (e) {}
    };
  }, [currentObjectUrl]);

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswords(prev => ({ ...prev, [name]: value }));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      const token = authToken || localStorage.getItem('token');
      if (!token) throw new Error('No hay sesión activa');

      const res = await fetch(`${API_BASE}/auth/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          nombre_completo: formData.nombreCompleto,
          telefono: formData.telefono,
          direccion: formData.direccion,
          ciudad: formData.ciudad,
          foto_url: formData.fotoUrl || null,
          about_me: formData.aboutMe || null,
          fecha_nacimiento: formData.fechaNacimiento || null,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Error al actualizar perfil');
      }

      setMessage('✅ Cambio exitoso');

      // Recargar perfil para obtener datos actualizados con la nueva foto
      const updatedProfileRes = await fetch(`${API_BASE}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (updatedProfileRes.ok) {
        const updatedProfile = await updatedProfileRes.json();
        setFormData({
          nombreCompleto: updatedProfile.nombre_completo || formData.nombreCompleto,
          telefono: updatedProfile.telefono || formData.telefono,
          direccion: updatedProfile.direccion || formData.direccion,
          ciudad: updatedProfile.ciudad || formData.ciudad,
          fechaNacimiento: updatedProfile.fecha_nacimiento ? updatedProfile.fecha_nacimiento.split('T')[0] : formData.fechaNacimiento,
          aboutMe: updatedProfile.about_me || formData.aboutMe,
          fotoUrl: updatedProfile.foto_url || formData.fotoUrl,
        });
        // Actualizar preview con la nueva foto
        let previewCandidate = updatedProfile.foto_url || '';
        if (previewCandidate && previewCandidate.startsWith('data:')) {
          const blobUrl = dataUrlToBlobUrl(previewCandidate);
          if (blobUrl) previewCandidate = blobUrl;
        }
        if (previewCandidate && await preloadImage(previewCandidate)) {
          if (currentObjectUrl && currentObjectUrl !== previewCandidate) {
            try { URL.revokeObjectURL(currentObjectUrl); } catch {}
            setCurrentObjectUrl(null);
          }
          setPhotoPreview(previewCandidate);
          if (previewCandidate.startsWith('blob:')) setCurrentObjectUrl(previewCandidate);
        }
      }

      // Actualizar contexto global para que se refleje en el sidebar
      if (updateUserData) {
        updateUserData({
          full_name: formData.nombreCompleto,
          nombre_completo: formData.nombreCompleto,
          telefono: formData.telefono,
          direccion: formData.direccion,
          ciudad: formData.ciudad,
          foto_url: formData.fotoUrl,
          about_me: formData.aboutMe,
          fecha_nacimiento: formData.fechaNacimiento,
        });
      }

      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('❌ Cambio no exitoso: ' + (err?.message || 'Error desconocido'));
      setTimeout(() => setMessage(''), 5000);
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (passwords.newPassword !== passwords.confirmPassword) {
      setMessage('❌ Las contraseñas nuevas no coinciden');
      return;
    }
    if (passwords.newPassword.length < 6) {
      setMessage('❌ La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setSaving(true);
    setMessage('');

    try {
      const token = authToken || localStorage.getItem('token');
      if (!token) {
        throw new Error('No hay token de autenticación');
      }
      await changePassword(passwords.currentPassword, passwords.newPassword, token);
      setMessage('✅ Cambio exitoso');
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowCurrent(false);
      setShowNew(false);
      setShowConfirm(false);
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('❌ Cambio no exitoso: ' + (err?.message || 'Error desconocido'));
      setTimeout(() => setMessage(''), 5000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="client-profile">
      <h1>Mi Perfil</h1>
      <p className="welcome-subtitle" style={{ marginBottom: '32px' }}>
        Actualiza tu información personal y cambia tu contraseña
      </p>

      {loadingProfile ? (
        <div style={{ marginBottom: 28, fontWeight: 600 }}>Cargando perfil...</div>
      ) : (
        message && (
          <div style={{
            background: message.includes('❌') ? '#fee2e2' : '#dcfce7',
            color: message.includes('❌') ? '#b91c1c' : '#166534',
            padding: '14px 20px',
            borderRadius: '12px',
            marginBottom: '28px',
            fontWeight: 600
          }}>
            {message}
          </div>
        )
      )}

      {/* === FORMULARIOS LADO A LADO (mejor UX) === */}
      <div className="profile-forms-grid">
        {/* === INFORMACIÓN PERSONAL === */}
        <div className="card profile-form-card">
          <h2 style={{ fontSize: '20px', marginBottom: '6px' }}>Información Personal</h2>
          <p style={{ color: '#666', fontSize: '13px', marginBottom: '20px' }}>
            Datos que usaste al registrarte
          </p>

          <form className="auth-form" onSubmit={handleProfileSubmit}>

            {/* === AVATAR DE PERFIL AL INICIO === */}
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              marginBottom: 28 
            }}>
              <ImageUpload
                value={photoPreview}
                onChange={handlePhotoChange}
                mode="api"
                uploadEndpoint={`${API_BASE}/auth/uploads`}
                label="Cambiar foto"
                previewSize="medium"
                circular
              />
              <span style={{ 
                marginTop: 10, 
                fontSize: 13, 
                color: '#666',
                fontWeight: 500 
              }}>
                {photoPreview ? 'Cambiar foto de perfil' : 'Agregar foto de perfil'}
              </span>
            </div>

            <div className="form-group">
              <label className="auth-label">Nombre completo</label>
              <input
                type="text"
                name="nombreCompleto"
                className="auth-input"
                placeholder="Ej: María González"
                value={formData.nombreCompleto}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="auth-label">Teléfono</label>
              <input
                type="tel"
                name="telefono"
                className="auth-input"
                placeholder="+57 300 123 4567"
                value={formData.telefono}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="auth-label">Dirección</label>
              <input
                type="text"
                name="direccion"
                className="auth-input"
                placeholder="Calle 123 #45-67, Ciudad"
                value={formData.direccion}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="auth-label">Ciudad</label>
              <input
                type="text"
                name="ciudad"
                className="auth-input"
                placeholder="Bogotá"
                value={formData.ciudad}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="auth-label">Fecha de nacimiento</label>
              <input
                type="date"
                name="fechaNacimiento"
                className="auth-input"
                value={formData.fechaNacimiento}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="auth-label">Acerca de mí</label>
              <textarea
                name="aboutMe"
                className="auth-input"
                placeholder="Cuéntanos un poco sobre ti..."
                value={formData.aboutMe}
                onChange={handleChange}
                rows={3}
                style={{ resize: 'vertical', minHeight: '80px' }}
              />
            </div>

            <div className="form-group">
              <label className="auth-label">Correo electrónico</label>
              <input
                type="email"
                name="email"
                className="auth-input"
                value={formData.email}
                disabled
                style={{ background: '#f4f4f5', color: '#888', cursor: 'not-allowed' }}
              />
              <small style={{ color: '#999', fontSize: '11px' }}>
                No se puede modificar por seguridad
              </small>
            </div>

            <button type="submit" className="auth-button" disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </form>
        </div>

        {/* === CAMBIAR CONTRASEÑA === */}
        <div className="card profile-form-card">
          <h2 style={{ fontSize: '20px', marginBottom: '6px' }}>Cambiar Contraseña</h2>
          <p style={{ color: '#666', fontSize: '13px', marginBottom: '20px' }}>
            Actualiza tu contraseña de forma segura
          </p>

          <form className="auth-form" onSubmit={handlePasswordSubmit}>
            <div className="form-group">
              <label className="auth-label">Contraseña actual</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showCurrent ? 'text' : 'password'}
                  name="currentPassword"
                  className="auth-input"
                  placeholder="••••••••"
                  value={passwords.currentPassword}
                  onChange={handlePasswordChange}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '18px'
                  }}
                >
                  {showCurrent ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="auth-label">Contraseña nueva</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showNew ? 'text' : 'password'}
                  name="newPassword"
                  className="auth-input"
                  placeholder="••••••••"
                  value={passwords.newPassword}
                  onChange={handlePasswordChange}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '18px'
                  }}
                >
                  {showNew ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="auth-label">Confirmar contraseña</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConfirm ? 'text' : 'password'}
                  name="confirmPassword"
                  className="auth-input"
                  placeholder="••••••••"
                  value={passwords.confirmPassword}
                  onChange={handlePasswordChange}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '18px'
                  }}
                >
                  {showConfirm ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            <button type="submit" className="auth-button" disabled={saving}>
              {saving ? 'Actualizando...' : 'Actualizar Contraseña'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ClientProfile;
