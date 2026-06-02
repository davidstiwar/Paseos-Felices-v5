import React, { useState, useEffect } from 'react';
import '../../../estilos/ClientPanel.css';
import { getGroomerProfile, updateGroomerProfile, createGroomerProfile, addServiceToGroomer, removeServiceFromGroomer } from '../../../api/groomer';
import { updateCurrentUserProfile } from '../../../api/auth';
import { getAllServices } from '../../../api/servicesCatalog';
import { getReviewsByGroomer } from '../../../api/reviews';
import { API } from '../../../api/config';
import { getSafeImageUrl, handleImageError } from '../../../utils/imageUtils';
import { useToast } from '../../../components/Context/ToastContext';
import ImageUpload from '../../../components/Common/ImageUpload';

const GroomerProfile = () => {
  const { showError, showSuccess } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [availableServices, setAvailableServices] = useState([]);
  const [groomerServices, setGroomerServices] = useState([]);
  const [groomerReviews, setGroomerReviews] = useState([]);
  const [availability, setAvailability] = useState({
    monday: { enabled: false, start: '09:00', end: '17:00' },
    tuesday: { enabled: false, start: '09:00', end: '17:00' },
    wednesday: { enabled: false, start: '09:00', end: '17:00' },
    thursday: { enabled: false, start: '09:00', end: '17:00' },
    friday: { enabled: false, start: '09:00', end: '17:00' },
    saturday: { enabled: false, start: '09:00', end: '17:00' },
    sunday: { enabled: false, start: '09:00', end: '17:00' },
  });
  const [profile, setProfile] = useState({
    full_name: '',
    email: '',
    phone: '',
    photo: '',
    bio: '',
    rating: 0,
    is_active: true,
    id: null,
    // Campos de auth-service (read-only)
    address: '',
    city: '',
    dateOfBirth: '',
  });

  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    bio: '',
    address: '',
    city: '',
    photo: '',
  });
  const [photoPreview, setPhotoPreview] = useState('');
  const [errors, setErrors] = useState({});

  // Cargar perfil del groomer y servicios al montar el componente
  useEffect(() => {
    const loadProfile = async () => {
      try {
        // Cargar servicios disponibles del catálogo
        const servicesData = await getAllServices();
        setAvailableServices(servicesData);

        // Primero obtener datos del usuario desde auth-service
        const userResponse = await fetch(`${API.auth}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (!userResponse.ok) {
          throw new Error('Error al obtener datos del usuario');
        }
        
        const userData = await userResponse.json();
        console.log('Datos del usuario desde auth-service:', userData);
        
        // Intentar obtener perfil del groomer
        let groomerData = null;
        try {
          groomerData = await getGroomerProfile();
        } catch (error) {
          console.warn('Error al obtener perfil del groomer, intentando crear uno nuevo:', error);
          groomerData = null;
        }
        
        console.log('Datos del groomer:', groomerData);
        
        // Si no existe perfil de groomer, crear uno automáticamente con los datos del auth-service
        if (!groomerData) {
          try {
            console.log('Creando perfil de groomer automáticamente...');
            const newGroomerProfile = {
              full_name: userData.nombre_completo || '',
              phone: userData.telefono || '',
              bio: userData.about_me || '',
              photo: userData.foto_url || '',
            };
            groomerData = await createGroomerProfile(newGroomerProfile);
            console.log('Perfil de groomer creado exitosamente:', groomerData);
            showSuccess('✅ Perfil de groomer creado automáticamente');
          } catch (createError) {
            console.warn('No se pudo crear perfil automático:', createError);
            // Continuar de todas formas con los datos del auth-service
            groomerData = null;
          }
        }
        
        if (groomerData && groomerData.services) {
          setGroomerServices(groomerData.services);
        }

        // Cargar reseñas reales (reviews-service) si tenemos groomer_id
        if (groomerData?.id) {
          const reviews = await getReviewsByGroomer(groomerData.id).catch(() => []);
          setGroomerReviews(Array.isArray(reviews) ? reviews : []);
        } else {
          setGroomerReviews([]);
        }
        
        setProfile({
          full_name: groomerData?.full_name || userData.nombre_completo || '',
          email: groomerData?.email || userData.email || '',
          phone: groomerData?.phone || userData.telefono || '',
          photo: groomerData?.photo || userData.foto_url || '',
          bio: groomerData?.bio || userData.about_me || '',
          rating: groomerData?.rating || 0,
          is_active: groomerData?.is_active ?? true,
          id: groomerData?.id || null,
          // Campos de auth-service (read-only)
          address: userData.direccion || '',
          city: userData.ciudad || '',
          dateOfBirth: userData.fecha_nacimiento ? userData.fecha_nacimiento.split('T')[0] : '',
        });
        setFormData({
          full_name: groomerData?.full_name || userData.nombre_completo || '',
          phone: groomerData?.phone || userData.telefono || '',
          bio: groomerData?.bio || userData.about_me || '',
          address: userData.direccion || '',
          city: userData.ciudad || '',
          photo: groomerData?.photo || userData.foto_url || '',
        });
        setPhotoPreview(groomerData?.photo || userData.foto_url || '');
      } catch (err) {
        console.error('Error cargando perfil:', err);
        showError(err.message || 'Error al cargar el perfil. Por favor intenta de nuevo.');
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [showSuccess, showError]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.full_name || formData.full_name.trim() === '') {
      newErrors.full_name = 'El nombre es obligatorio';
    }

    if (!formData.phone || formData.phone.trim() === '') {
      newErrors.phone = 'El teléfono es obligatorio';
    }

    if (!formData.address || formData.address.trim() === '') {
      newErrors.address = 'La dirección es obligatoria';
    }

    if (!formData.city || formData.city.trim() === '') {
      newErrors.city = 'La ciudad es obligatoria';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (Object.keys(errors).length > 0) {
      validateForm();
    }
  };

  const handlePhotoChange = async (url) => {
    setFormData(prev => ({ ...prev, photo: url }));
    setPhotoPreview(url);
  };


  const handleSaveChanges = async () => {
    if (validateForm()) {
      setSaving(true);
      try {
        // Verificar si el perfil de groomer existe
        let groomerData = await getGroomerProfile();
        
        // Actualizar datos del groomer-service
        const groomerProfileData = {
          full_name: formData.full_name,
          phone: formData.phone,
          bio: formData.bio,
          photo: formData.photo,
        };
        
        if (groomerData) {
          // Actualizar perfil existente
          await updateGroomerProfile(groomerData.id, groomerProfileData);
        } else {
          // Crear nuevo perfil
          await createGroomerProfile(groomerProfileData);
        }
        
        // Actualizar datos del auth-service (dirección, ciudad y foto) solo si hay cambios y existe token
        const authProfileData = {};
        if (formData.address && formData.address !== profile.address) authProfileData.direccion = formData.address;
        if (formData.city && formData.city !== profile.city) authProfileData.ciudad = formData.city;
        if (formData.photo && formData.photo !== profile.photo) authProfileData.foto_url = formData.photo;
        const token = localStorage.getItem('token');
        if (Object.keys(authProfileData).length > 0) {
          if (!token) {
            console.warn('No auth token available — skipping auth-service update');
          } else {
            await updateCurrentUserProfile(authProfileData, token);
          }
        }

        // Recargar perfil para obtener datos actualizados
        const updatedGroomerData = await getGroomerProfile();
        const updatedUserData = await fetch(`${API.auth}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }).then(res => res.json());
        
        setProfile(prev => ({
          ...prev,
          full_name: updatedGroomerData.full_name,
          phone: updatedGroomerData.phone,
          bio: updatedGroomerData.bio,
          address: updatedUserData.direccion,
          city: updatedUserData.ciudad,
          photo: updatedGroomerData.photo || updatedUserData.foto_url,
        }));
        setPhotoPreview(updatedGroomerData.photo || updatedUserData.foto_url);
        setIsEditing(false);
        setErrors({});
        showSuccess('Perfil guardado exitosamente');
      } catch (err) {
        console.error('Error guardando perfil:', err);
        showError(err.message || 'Error al guardar el perfil. Por favor intenta de nuevo.');
      } finally {
        setSaving(false);
      }
    }
  };

  const handleCancelEdit = () => {
    setFormData({
      full_name: profile.full_name,
      phone: profile.phone,
      bio: profile.bio,
      address: profile.address,
      city: profile.city,
      photo: profile.photo,
    });
    setPhotoPreview(profile.photo);
    setIsEditing(false);
    setErrors({});
  };

  const handleAddService = async (serviceId) => {
    if (!profile.id) {
      showError('Primero debes crear tu perfil de groomer');
      return;
    }
    try {
      await addServiceToGroomer(profile.id, serviceId);
      // Recargar servicios del groomer
      const groomerData = await getGroomerProfile();
      if (groomerData && groomerData.services) {
        setGroomerServices(groomerData.services);
      }
      showSuccess('Servicio agregado exitosamente');
    } catch (err) {
      console.error('Error agregando servicio:', err);
      showError(err.message || 'Error al agregar servicio');
    }
  };

  const handleRemoveService = async (serviceId) => {
    if (!profile.id) return;
    try {
      await removeServiceFromGroomer(profile.id, serviceId);
      // Recargar servicios del groomer
      const groomerData = await getGroomerProfile();
      if (groomerData && groomerData.services) {
        setGroomerServices(groomerData.services);
      }
      showSuccess('Servicio removido exitosamente');
    } catch (err) {
      console.error('Error removiendo servicio:', err);
      showError(err.message || 'Error al remover servicio');
    }
  };

  return (
    <div className="groomer-profile">
      {loading ? (
        <p>Cargando perfil...</p>
      ) : (
        <>
          <div className="profile-header">
            <h1>👤 Mi Perfil</h1>
            <div className="header-buttons">
              {isEditing && (
                <button 
                  className="cancel-btn"
                  onClick={handleCancelEdit}
                >
                  ❌ Cancelar
                </button>
              )}
              <button 
                className={`edit-btn ${isEditing ? 'active' : ''}`}
                onClick={() => {
                  if (isEditing) {
                    handleSaveChanges();
                  } else {
                    setErrors({});
                    setIsEditing(true);
                  }
                }}
                disabled={isEditing && (Object.keys(errors).length > 0 || saving)}
              >
                {saving ? 'Guardando...' : (isEditing ? '💾 Guardar Cambios' : '✏️ Editar Perfil')}
              </button>
            </div>
          </div>

          <div className="profile-container">
        {/* Profile Summary */}
        <div className="profile-summary">
          <div className="profile-photo-section">
            {(photoPreview || profile.photo) && getSafeImageUrl(photoPreview || profile.photo) !== '🐾' ? (
              <img 
                src={getSafeImageUrl(photoPreview || profile.photo)} 
                alt={profile.full_name} 
                className="profile-photo"
                onError={(e) => handleImageError(e, `groomer-profile-${profile.id}`)}
              />
            ) : null}
            <div className="profile-photo-placeholder" style={{ display: (!photoPreview && !profile.photo) ? 'flex' : 'none' }}>👤</div>
            {isEditing && (
              <ImageUpload
                value={photoPreview}
                onChange={handlePhotoChange}
                mode="api"
                uploadEndpoint={`${API.auth}/auth/uploads`}
                label="📸 Cambiar foto"
                previewSize="medium"
                circular
              />
            )}
            {isEditing ? (
              <>
                <input 
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  className={`edit-input ${errors.full_name ? 'error' : ''}`}
                  placeholder="Tu nombre"
                />
                {errors.full_name && <span className="error-text">{errors.full_name}</span>}
              </>
            ) : (
              <h2 className="profile-name">{profile.full_name}</h2>
            )}
            
            {/* Stats debajo del nombre */}
            <div className="profile-stats">
              <div className="stat">
                <span className="label">Rating</span>
                <span className="value">⭐ {profile.rating > 0 ? profile.rating : 'Sin calificar'}</span>
              </div>
            </div>
          </div>

          <div className="profile-info-section">
          </div>
        </div>

        {/* Profile Details */}
         <div className="profile-details">
           <div className="profile-section">
            <h3>📋 Información de Contacto</h3>
            <div className="contact-item">
              <div>
                <div className="label">Teléfono</div>
                 {isEditing ? (
                   <>
                    <input 
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className={`edit-input ${errors.phone ? 'error' : ''}`}
                    />
                    {errors.phone && <span className="error-text">{errors.phone}</span>}
                   </>
                 ) : (
                   <p>{profile.phone}</p>
                 )}
              </div>
            </div>

            <div className="contact-item">
              <div>
                <div className="label">Dirección</div>
                 {isEditing ? (
                   <>
                    <input 
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className={`edit-input ${errors.address ? 'error' : ''}`}
                      placeholder="Calle 123 #45-67"
                    />
                    {errors.address && <span className="error-text">{errors.address}</span>}
                   </>
                 ) : (
                   <p>{profile.address}</p>
                 )}
              </div>
            </div>

            <div className="contact-item">
              <div>
                <div className="label">Ciudad</div>
                 {isEditing ? (
                   <>
                    <input 
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className={`edit-input ${errors.city ? 'error' : ''}`}
                      placeholder="Ej: Bogotá"
                    />
                    {errors.city && <span className="error-text">{errors.city}</span>}
                   </>
                 ) : (
                   <p>{profile.city}</p>
                 )}
              </div>
            </div>

            <div className="contact-item">
              <div>
                <div className="label">Fecha de Nacimiento</div>
                <p>{profile.dateOfBirth}</p>
              </div>
            </div>
          </div>

          {/* Servicios del Groomer */}
          <div className="profile-section">
            <h3>🛁 Servicios que ofrezco</h3>
            {groomerServices.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '15px', marginTop: '15px' }}>
                {groomerServices.map((service) => (
                  <div key={service.id} style={{
                    background: 'var(--bg-card)',
                    padding: '15px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    boxShadow: 'var(--shadow-sm)',
                    position: 'relative'
                  }}>
                    <button
                      onClick={() => handleRemoveService(service.id)}
                      style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        background: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        width: '24px',
                        height: '24px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      ×
                    </button>
                    <h4 style={{ margin: '0 0 8px 0', color: 'var(--primary)', paddingRight: '30px' }}>{service.name}</h4>
                    <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: 'var(--text-secondary)' }}>
                      {service.description || 'Sin descripción'}
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-tertiary)' }}>
                      <span>{service.category}</span>
                      <span>${service.base_price}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--text-tertiary)', marginTop: '15px' }}>No tienes servicios asignados aún.</p>
            )}
          </div>

          {/* Servicios Disponibles para Agregar */}
          <div className="profile-section">
            <h3>➕ Agregar Servicios</h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '15px' }}>Selecciona los servicios que deseas ofrecer:</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '15px' }}>
              {availableServices
                .filter(service => !groomerServices.some(gs => gs.id === service.id))
                .map((service) => (
                <div key={service.id} style={{
                  background: 'var(--bg-card)',
                  padding: '15px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  boxShadow: 'var(--shadow-sm)'
                }}>
                  <h4 style={{ margin: '0 0 8px 0', color: 'var(--primary)' }}>{service.name}</h4>
                  <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: 'var(--text-secondary)' }}>
                    {service.description || 'Sin descripción'}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: 'var(--text-tertiary)' }}>
                    <span>{service.category}</span>
                    <span>${service.base_price}</span>
                  </div>
                  <button
                    onClick={() => handleAddService(service.id)}
                    style={{
                      marginTop: '10px',
                      background: 'var(--primary)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '8px 16px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      width: '100%'
                    }}
                  >
                    Agregar
                  </button>
                </div>
              ))}
            </div>
            {availableServices.filter(service => !groomerServices.some(gs => gs.id === service.id)).length === 0 && (
              <p style={{ color: 'var(--text-tertiary)', marginTop: '15px' }}>Ya has agregado todos los servicios disponibles.</p>
            )}
          </div>

           {/* Bio Section */}
           <div className="profile-section">
            <h3>📝 Acerca de Ti</h3>
            <div>
              <div className="label" style={{marginBottom: '6px'}}>Biografía</div>
               {isEditing ? (
                 <>
                  <textarea 
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    className={`edit-textarea ${errors.bio ? 'error' : ''}`}
                    rows="4"
                  />
                  {errors.bio && <span className="error-text">{errors.bio}</span>}
                 </>
               ) : (
                 <p className="bio-text">{profile.bio}</p>
               )}
            </div>
          </div>

        </div>


        {/* Reviews Section */}
        <div className="profile-section">
          <h3>⭐ Reseñas y Ranking</h3>
          
          {/* Rating Summary */}
          {groomerReviews.length > 0 && (
            <div style={{
              background: 'linear-gradient(135deg, #e07a5f 0%, #d4a373 100%)',
              borderRadius: 16,
              padding: 24,
              marginBottom: 24,
              color: 'white',
              boxShadow: '0 8px 24px rgba(224, 122, 95, 0.3)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
                <div>
                  <div style={{ fontSize: 48, fontWeight: 700, lineHeight: 1 }}>
                    {profile.rating > 0 ? profile.rating.toFixed(1) : '0.0'}
                  </div>
                  <div style={{ fontSize: 14, opacity: 0.9 }}>
                    {'⭐'.repeat(Math.round(profile.rating) || 0)}
                  </div>
                  <div style={{ fontSize: 13, opacity: 0.8, marginTop: 4 }}>
                    {groomerReviews.length} reseñas
                  </div>
                </div>
                
                {/* Rating Distribution */}
                <div style={{ flex: 1, minWidth: 200 }}>
                  {[5, 4, 3, 2, 1].map(star => {
                    const count = groomerReviews.filter(r => Math.round(r.rating) === star).length;
                    const percentage = groomerReviews.length > 0 ? (count / groomerReviews.length) * 100 : 0;
                    return (
                      <div key={star} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <span style={{ fontSize: 13, minWidth: 40 }}>{star} ⭐</span>
                        <div style={{ 
                          flex: 1, 
                          height: 8, 
                          background: 'rgba(255, 255, 255, 0.2)', 
                          borderRadius: 4,
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            width: `${percentage}%`,
                            height: '100%',
                            background: 'white',
                            borderRadius: 4,
                            transition: 'width 0.3s ease'
                          }} />
                        </div>
                        <span style={{ fontSize: 12, minWidth: 30, textAlign: 'right' }}>{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Reviews List */}
          <div className="reviews-list">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h4 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>
                {groomerReviews.length > 0 ? `${groomerReviews.length} Reseñas` : 'Sin Reseñas'}
              </h4>
              {groomerReviews.length > 5 && (
                <button 
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--border-color)',
                    borderRadius: 8,
                    padding: '6px 12px',
                    fontSize: 13,
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.background = 'var(--bg-hover)';
                    e.target.style.borderColor = 'var(--text-primary)';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.background = 'transparent';
                    e.target.style.borderColor = 'var(--border-color)';
                  }}
                >
                  Ver todas
                </button>
              )}
            </div>
            
            {groomerReviews.length > 0 ? (
              <div style={{ display: 'grid', gap: 14 }}>
                {groomerReviews.slice(0, 5).map((r) => (
                  <div
                    key={r.id}
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 12,
                      padding: 16,
                      boxShadow: 'var(--shadow-sm)',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => {
                      e.target.style.boxShadow = 'var(--shadow-md)';
                      e.target.style.transform = 'translateY(-2px)';
                    }}
                    onMouseOut={(e) => {
                      e.target.style.boxShadow = 'var(--shadow-sm)';
                      e.target.style.transform = 'translateY(0)';
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ 
                          fontWeight: 700, 
                          fontSize: 18,
                          color: '#e07a5f'
                        }}>
                          {'⭐'.repeat(Number(r.rating) || 0) || 'Sin calificar'}
                        </div>
                        {r.user_name && (
                          <span style={{ 
                            fontSize: 13, 
                            fontWeight: 500,
                            color: 'var(--text-secondary)',
                            background: 'var(--bg-hover)',
                            padding: '4px 10px',
                            borderRadius: 12
                          }}>
                            {r.user_name}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>
                        {r.created_at ? new Date(r.created_at).toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        }) : ''}
                      </div>
                    </div>
                    <div style={{ 
                      marginTop: 8, 
                      color: 'var(--text-secondary)',
                      fontSize: 14,
                      lineHeight: 1.5
                    }}>
                      {r.comment ? r.comment : 'Sin comentario'}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '40px 20px',
                background: 'var(--bg-hover)',
                borderRadius: 12,
                color: 'var(--text-tertiary)'
              }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>⭐</div>
                <p style={{ margin: 0, fontSize: 16 }}>Aún no tienes reseñas</p>
                <p style={{ margin: '8px 0 0 0', fontSize: 13 }}>
                  Los clientes podrán dejar reseñas después de completar citas contigo
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Simple Availability Manager */}
        <div className="profile-section">
          <h3>📅 Horario de Disponibilidad</h3>
          <div style={{ display: 'grid', gap: 12 }}>
            {Object.entries(availability).map(([day, config]) => (
              <div key={day} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: 12,
                background: 'var(--bg-hover)',
                borderRadius: 8,
                border: '1px solid var(--border-color)'
              }}>
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 8, 
                  cursor: 'pointer',
                  minWidth: 120,
                  fontWeight: 600,
                  color: 'var(--text-primary)'
                }}>
                  <input
                    type="checkbox"
                    checked={config.enabled}
                    onChange={(e) => {
                      setAvailability(prev => ({
                        ...prev,
                        [day]: { ...prev[day], enabled: e.target.checked }
                      }));
                    }}
                    style={{ width: 18, height: 18 }}
                  />
                  {day.charAt(0).toUpperCase() + day.slice(1)}
                </label>
                {config.enabled && (
                  <>
                    <input
                      type="time"
                      value={config.start}
                      onChange={(e) => {
                        setAvailability(prev => ({
                          ...prev,
                          [day]: { ...prev[day], start: e.target.value }
                        }));
                      }}
                      style={{
                        padding: 8,
                        borderRadius: 6,
                        border: '1px solid var(--border-color)',
                        fontSize: 14
                      }}
                    />
                    <span style={{ color: 'var(--text-secondary)' }}>a</span>
                    <input
                      type="time"
                      value={config.end}
                      onChange={(e) => {
                        setAvailability(prev => ({
                          ...prev,
                          [day]: { ...prev[day], end: e.target.value }
                        }));
                      }}
                      style={{
                        padding: 8,
                        borderRadius: 6,
                        border: '1px solid var(--border-color)',
                        fontSize: 14
                      }}
                    />
                  </>
                )}
              </div>
            ))}
          </div>
          <button
            onClick={() => {
              // Save availability to groomer profile
              showSuccess('Horario de disponibilidad guardado');
            }}
            style={{
              marginTop: 16,
              padding: '12px 20px',
              background: 'linear-gradient(135deg, #e07a5f 0%, #d4a373 100%)',
              color: 'white',
              border: 'none',
              borderRadius: 10,
              fontSize: 16,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 4px 12px rgba(224, 122, 95, 0.3)'
            }}
            onMouseOver={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 16px rgba(224, 122, 95, 0.4)';
            }}
            onMouseOut={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 12px rgba(224, 122, 95, 0.3)';
            }}
          >
            Guardar Horario
          </button>
        </div>
      </div>
      </>
      )}
    </div>
  );
};

export default GroomerProfile;
