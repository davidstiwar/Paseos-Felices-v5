import React, { useState, useEffect } from 'react';
import { useUser } from '../../../components/Context/UserContext';
import { updateUserProfile, changePassword } from '../../../api/auth';
import '../../../estilos/admin/AdminProfile.css';
import ImageUpload from '../../../components/Common/ImageUpload';

const AdminProfile = () => {
  const { user, token } = useUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    nombre_completo: '',
    email: '',
    telefono: '',
    direccion: '',
    ciudad: '',
    foto_url: ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [previewPhoto, setPreviewPhoto] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        nombre_completo: user.nombre_completo || '',
        email: user.email || '',
        telefono: user.telefono || '',
        direccion: user.direccion || '',
        ciudad: user.ciudad || '',
        foto_url: user.foto_url || ''
      });
      setPreviewPhoto(user.foto_url || '');
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePhotoChange = (base64) => {
    setPreviewPhoto(base64);
    setFormData(prev => ({
      ...prev,
      foto_url: base64
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await updateUserProfile(formData);
      setSuccess('Perfil actualizado correctamente');
      setIsEditing(false);
      // Recargar datos del usuario para mostrar la foto actualizada
      const updatedUserRes = await fetch(`${process.env.REACT_APP_API_BASE || 'http://localhost:8000'}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (updatedUserRes.ok) {
        const updatedUser = await updatedUserRes.json();
        setFormData({
          nombre_completo: updatedUser.nombre_completo || formData.nombre_completo,
          email: updatedUser.email || formData.email,
          telefono: updatedUser.telefono || formData.telefono,
          direccion: updatedUser.direccion || formData.direccion,
          ciudad: updatedUser.ciudad || formData.ciudad,
          foto_url: updatedUser.foto_url || formData.foto_url
        });
        setPreviewPhoto(updatedUser.foto_url || formData.foto_url);
      }
    } catch (err) {
      setError(err.message || 'Error al actualizar el perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Revertir cambios
    if (user) {
      setFormData({
        nombre_completo: user.nombre_completo || '',
        email: user.email || '',
        telefono: user.telefono || '',
        direccion: user.direccion || '',
        ciudad: user.ciudad || '',
        foto_url: user.foto_url || ''
      });
      setPreviewPhoto(user.foto_url || '');
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('Las contraseñas nuevas no coinciden');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await changePassword(passwordData.currentPassword, passwordData.newPassword, token);
      setSuccess('Contraseña cambiada correctamente');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setIsChangingPassword(false);
    } catch (err) {
      setError(err.message || 'Error al cambiar la contraseña');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-profile-container">
      <div className="admin-profile-header">
        <h1>Mi Perfil</h1>
        <p>Administra tu información personal</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="admin-profile-content">
        <div className="profile-photo-section">
          <ImageUpload
            value={previewPhoto}
            onChange={handlePhotoChange}
            mode="base64"
            label="📷 Cambiar foto"
            previewSize="medium"
            circular
            disabled={!isEditing}
          />
        </div>

        <div className="profile-form-section">
          <div className="form-group">
            <label>Nombre Completo</label>
            <input
              type="text"
              name="nombre_completo"
              value={formData.nombre_completo}
              onChange={handleChange}
              disabled={!isEditing}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              disabled={!isEditing}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Teléfono</label>
            <input
              type="tel"
              name="telefono"
              value={formData.telefono}
              onChange={handleChange}
              disabled={!isEditing}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Dirección</label>
            <input
              type="text"
              name="direccion"
              value={formData.direccion}
              onChange={handleChange}
              disabled={!isEditing}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Ciudad</label>
            <input
              type="text"
              name="ciudad"
              value={formData.ciudad}
              onChange={handleChange}
              disabled={!isEditing}
              className="form-input"
            />
          </div>

          {/* Sección de cambio de contraseña */}
          <div style={{ marginTop: '32px', paddingTop: '32px', borderTop: '1px solid #444' }}>
            <h3 style={{ marginBottom: '16px', fontSize: '16px', color: '#fff' }}>Cambiar Contraseña</h3>
            
            {!isChangingPassword ? (
              <button 
                className="btn-secondary" 
                onClick={() => setIsChangingPassword(true)}
                style={{ width: 'auto' }}
              >
                🔑 Cambiar Contraseña
              </button>
            ) : (
              <>
                <div className="form-group">
                  <label>Contraseña Actual</label>
                  <input
                    type="password"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    className="form-input"
                    placeholder="Ingresa tu contraseña actual"
                  />
                </div>

                <div className="form-group">
                  <label>Nueva Contraseña</label>
                  <input
                    type="password"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    className="form-input"
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>

                <div className="form-group">
                  <label>Confirmar Nueva Contraseña</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    className="form-input"
                    placeholder="Confirma tu nueva contraseña"
                  />
                </div>

                <div className="form-actions" style={{ marginTop: '16px' }}>
                  <button 
                    className="btn-secondary" 
                    onClick={() => {
                      setIsChangingPassword(false);
                      setPasswordData({
                        currentPassword: '',
                        newPassword: '',
                        confirmPassword: ''
                      });
                    }}
                    disabled={loading}
                  >
                    ❌ Cancelar
                  </button>
                  <button 
                    className="btn-primary" 
                    onClick={handleChangePassword}
                    disabled={loading}
                  >
                    {loading ? 'Cambiando...' : '💾 Cambiar Contraseña'}
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="form-actions">
            {!isEditing ? (
              <button 
                className="btn-primary" 
                onClick={() => setIsEditing(true)}
              >
                ✏️ Editar Perfil
              </button>
            ) : (
              <>
                <button 
                  className="btn-secondary" 
                  onClick={handleCancel}
                  disabled={loading}
                >
                  ❌ Cancelar
                </button>
                <button 
                  className="btn-primary" 
                  onClick={handleSave}
                  disabled={loading}
                >
                  {loading ? 'Guardando...' : '💾 Guardar Cambios'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminProfile;
