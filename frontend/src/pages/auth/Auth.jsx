import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../estilos/Auth.css';
import { loginUser, registerUser, submitGroomerApplication, getCurrentUserProfile, validateRegistrationLogin } from '../../api/auth';
import { useUser } from '../../components/Context/UserContext';
import ImageUpload from '../../components/Common/ImageUpload';
import OAuthButtons from '../../components/Auth/OAuthButtons';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isGroomer, setIsGroomer] = useState(false);  // Switch Cliente/Groomer
  const [previewFoto, setPreviewFoto] = useState(null);  // Vista previa de foto
  const { saveSession } = useUser();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    nombreCompleto: '',
    telefono: '',
    direccion: '',
    ciudad: '',
    fotoUrl: '',
    aboutMe: '',
    fechaNacimiento: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const navigate = useNavigate();

  // Estados para manejo de errores y mensajes (sin usar alert())
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Cargar email recordado
  useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
      setFormData(prev => ({ ...prev, email: rememberedEmail }));
      setRememberMe(true);
    }
  }, []);

  // Limpiar rememberedEmail al cambiar de modo
  useEffect(() => {
    if (!isLogin) {
      localStorage.removeItem('rememberedEmail');
      setFormData(prev => ({ ...prev, email: '' }));
      setRememberMe(false);
    }
  }, [isLogin]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Limpiar error del campo mientras el usuario escribe
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleConfirmPasswordChange = (e) => {
    setConfirmPassword(e.target.value);
    
    // Limpiar error de confirmación mientras escribe
    if (errors.confirmPassword) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.confirmPassword;
        return newErrors;
      });
    }
  };

  const handleFotoChange = (base64) => {
    setPreviewFoto(base64);
    setFormData(prev => ({ ...prev, fotoUrl: base64 }));
    
    // Limpiar error
    if (errors.fotoUrl) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.fotoUrl;
        return newErrors;
      });
    }
  };

  // Función de validación
  const validateForm = () => {
    const newErrors = {};

    // Email
    if (!formData.email.trim()) {
      newErrors.email = 'El correo electrónico es obligatorio';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Ingresa un correo electrónico válido';
    }

    // Password
    if (!formData.password) {
      newErrors.password = 'La contraseña es obligatoria';
    } else if (formData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    if (!isLogin) {
      // Registro adicional
      if (!formData.nombreCompleto.trim()) {
        newErrors.nombreCompleto = 'El nombre completo es obligatorio';
      }

      if (!confirmPassword) {
        newErrors.confirmPassword = 'Confirma tu contraseña';
      } else if (formData.password !== confirmPassword) {
        newErrors.confirmPassword = 'Las contraseñas no coinciden';
      }

      if (!formData.telefono.trim()) {
        newErrors.telefono = 'El teléfono es obligatorio';
      }

      if (!formData.direccion.trim()) {
        newErrors.direccion = 'La dirección es obligatoria';
      }

      if (!formData.ciudad.trim()) {
        newErrors.ciudad = 'La ciudad es obligatoria';
      }

      // Fecha de nacimiento obligatoria para todos los registros
      if (!formData.fechaNacimiento) {
        newErrors.fechaNacimiento = 'La fecha de nacimiento es obligatoria';
      }

      // Validaciones específicas de Groomer
      if (isGroomer) {
        // about_me requiere mínimo 10 caracteres según el backend (obligatorio)
        if (!formData.aboutMe || formData.aboutMe.trim().length < 10) {
          newErrors.aboutMe = 'Debe tener al menos 10 caracteres (obligatorio)';
        }
      } else {
        // Validación para Cliente: máximo 50 caracteres
        if (formData.aboutMe.length > 50) {
          newErrors.aboutMe = 'Máximo 50 caracteres';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrors({});

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      if (isLogin) {
        // === LOGIN REAL ===
        if (rememberMe) {
          localStorage.setItem('rememberedEmail', formData.email);
        } else {
          localStorage.removeItem('rememberedEmail');
        }

        const data = await loginUser(formData.email, formData.password);

        // Guardar sesión en el contexto centralizado
        saveSession(data.access_token, data.user, data.user.role);

        // Redirigir según rol
        const role = data.user.role;
        if (role === 'groomer') {
          navigate('/groomer');
        } else if (role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/client');
        }

      } else if (isGroomer) {
        // === SOLICITUD DE GROOMER ===
        const applicationData = {
          email: formData.email,
          nombreCompleto: formData.nombreCompleto,
          telefono: formData.telefono,
          password: formData.password,
          ciudad: formData.ciudad,
          direccion: formData.direccion,
          fechaNacimiento: formData.fechaNacimiento,
          fotoUrl: formData.fotoUrl,
          aboutMe: formData.aboutMe
        };

        await submitGroomerApplication(applicationData);

        setSuccessMessage(
          '¡Solicitud enviada exitosamente! El administrador revisará tu información. ' +
          'Te notificaremos por correo cuando sea procesada.'
        );

        // Limpiar formulario
        setTimeout(() => {
          setFormData({
            email: '',
            password: '',
            nombreCompleto: '',
            telefono: '',
            direccion: '',
            ciudad: '',
            fotoUrl: '',
            aboutMe: '',
            fechaNacimiento: ''
          });
          setPreviewFoto(null);
          setConfirmPassword('');
          setIsLogin(true);
          setIsGroomer(false);
          setSuccessMessage('');
        }, 2000);

      } else {
        // === REGISTRO DE CLIENTE ===
        const registrationData = await registerUser({
          nombreCompleto: formData.nombreCompleto,
          email: formData.email,
          telefono: formData.telefono,
          direccion: formData.direccion,
          ciudad: formData.ciudad,
          fotoUrl: formData.fotoUrl,
          aboutMe: formData.aboutMe,
          fechaNacimiento: formData.fechaNacimiento,
          password: formData.password,
        });

        // El backend ahora retorna Token con access_token y user (auto-login)
        if (registrationData && registrationData.access_token && registrationData.user) {
          try {
            // Paso 1: Validar el token usando /auth/me
            const validatedUser = await getCurrentUserProfile(registrationData.access_token);
            
            // Paso 2: Validación adicional - intentar login automático con las credenciales
            const loginValidation = await validateRegistrationLogin(formData.email, formData.password);
            
            if (loginValidation.success) {
              console.log('✅ Registro validado exitosamente mediante ambas validaciones');
            }
            
            // Guardar la sesión con los datos validados
            saveSession(
              registrationData.access_token, 
              validatedUser || registrationData.user, 
              registrationData.user.role || 'cliente'
            );

            // Mostrar mensaje de éxito breve
            setSuccessMessage('✅ ¡Cuenta creada y validada exitosamente! Iniciando sesión...');

            // Redirigir inmediatamente al dashboard del cliente
            setTimeout(() => {
              navigate('/client');
            }, 1200);
          } catch (validationError) {
            // Si alguna validación falla pero tenemos un token válido del registro, continuar
            console.warn('Validación adicional no completada, usando datos de registro:', validationError.message);
            
            try {
              // Intentar solo con el token del registro
              const fallbackUser = await getCurrentUserProfile(registrationData.access_token);
              saveSession(registrationData.access_token, fallbackUser || registrationData.user, registrationData.user.role || 'cliente');
            } catch (fallbackError) {
              // Si falla la validación, usar los datos del registro directamente
              console.warn('Usando datos de registro sin validación adicional');
              saveSession(registrationData.access_token, registrationData.user, registrationData.user.role || 'cliente');
            }
            
            setSuccessMessage('✅ ¡Cuenta creada exitosamente! Iniciando sesión...');
            setTimeout(() => {
              navigate('/client');
            }, 1200);
          }
        } else {
          // Fallback si no viene el token (no debería pasar)
          setSuccessMessage('¡Cuenta creada exitosamente! Ahora puedes iniciar sesión.');

          setTimeout(() => {
            setIsLogin(true);
            setSuccessMessage('');
            setErrors({});
          }, 1800);
        }
      }
    } catch (err) {
      const rawMessage = err?.message;
      const message = typeof rawMessage === 'string' && rawMessage.length > 0
        ? rawMessage
        : 'Ocurrió un error. Inténtalo de nuevo.';

      if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
        setErrors({ general: 'No se pudo conectar con el servidor. ¿Está corriendo el backend en el puerto 8000?' });
      } else {
        setErrors({ general: message });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setFormData({ 
      email: '', 
      password: '', 
      nombreCompleto: '', 
      telefono: '', 
      direccion: '',
      ciudad: '',
      fotoUrl: '',
      aboutMe: '',
      fechaNacimiento: ''
    });
    setPreviewFoto(null);
    setConfirmPassword('');
    setShowPassword(false);
    setErrors({});
    setSuccessMessage('');
    setIsGroomer(false);
  };

  return (
    <div className="auth-split">
      {/* LEFT - Image / Branding */}
      <div className="auth-left">
        <div className="auth-left-content">
          <div className="auth-mascot-right">
            <picture>
              <source 
                srcSet="/img/gato-1024.avif" 
                type="image/avif" 
              />
              <source 
                srcSet="/img/gato-1024.webp" 
                type="image/webp" 
              />
              <img 
                src="/img/gato-1024.png" 
                alt="Mascota feliz" 
                className="auth-mascot-img" 
              />
            </picture>
          </div>

          <h1>Paseos Felices</h1>
          <p>El mejor cuidado para tu mascota. Paseos, grooming y mucho amor.</p>

          <div className="auth-stats">
            <div className="auth-stat">
              <div className="number">12k+</div>
              <div className="label">Paseos completados</div>
            </div>
            <div className="auth-stat">
              <div className="number">4.9</div>
              <div className="label">Calificación promedio</div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT - Form */}
      <div className="auth-right">
        <div className="auth-card">
          <div className="auth-header">
            <h2>{isLogin ? 'Bienvenido de nuevo' : 'Crea tu cuenta'}</h2>
            <p>{isLogin ? 'Inicia sesión para continuar' : 'Únete a la comunidad de amantes de mascotas'}</p>
          </div>

          <div className="auth-tabs">
            <button
              className={`auth-tab ${isLogin ? 'active' : ''}`}
              onClick={() => {
                setIsLogin(true);
                setIsGroomer(false);
                setFormData({
                  email: '',
                  password: '',
                  nombreCompleto: '',
                  telefono: '',
                  direccion: '',
                  ciudad: '',
                  fotoUrl: '',
                  aboutMe: '',
                  fechaNacimiento: ''
                });
                setPreviewFoto(null);
                setConfirmPassword('');
                setErrors({});
                setSuccessMessage('');
              }}
            >
              Iniciar Sesión
            </button>
            <button
              className={`auth-tab ${!isLogin ? 'active' : ''}`}
              onClick={() => {
                setIsLogin(false);
                setIsGroomer(false);
                setFormData({
                  email: '',
                  password: '',
                  nombreCompleto: '',
                  telefono: '',
                  direccion: '',
                  ciudad: '',
                  fotoUrl: '',
                  aboutMe: '',
                  fechaNacimiento: ''
                });
                setPreviewFoto(null);
                setConfirmPassword('');
                setErrors({});
                setSuccessMessage('');
              }}
            >
              Registrarse
            </button>
          </div>

           {/* Mensajes de éxito y error (reemplazo de alert()) */}
           {successMessage && (
             <div className="auth-success-message">
               {successMessage}
             </div>
           )}

           {errors.general && (
             <div className="auth-error-message">
               {errors.general}
             </div>
           )}

            <form className="auth-form" onSubmit={handleSubmit}>
              {/* === SWITCH MODERNO CLIENTE / GROOMER === */}
              {!isLogin && (
                <div className="auth-switch-container">
                  <div className="auth-switch-label">Tipo de registro</div>
                  <div className="auth-switch">
                    <button 
                      type="button"
                      className={`switch-option ${!isGroomer ? 'active' : ''}`}
                      onClick={() => setIsGroomer(false)}
                    >
                      Cliente
                    </button>
                    <button 
                      type="button"
                      className={`switch-option ${isGroomer ? 'active' : ''}`}
                      onClick={() => setIsGroomer(true)}
                    >
                      Groomer
                    </button>
                  </div>
                  {isGroomer && (
                    <p className="switch-hint">
                      Los aspirantes a groomer envían una solicitud que debe ser aprobada por un administrador.
                    </p>
                  )}
                </div>
              )}

              {/* === FOTO DE PERFIL (Visible para todos, opcional) === */}
              {!isLogin && (
                <div className="form-group">
                  <label className="auth-label">Foto de Perfil (opcional)</label>
                  <ImageUpload
                    value={previewFoto}
                    onChange={handleFotoChange}
                    mode="base64"
                    label={previewFoto ? 'Cambiar foto' : 'Subir foto'}
                    previewSize="medium"
                    circular
                  />
                  {errors.fotoUrl && <p className="auth-error-text">{errors.fotoUrl}</p>}
                </div>
              )}

              {/* === EMAIL (Login + Registro) === */}
              <div className="form-group">
                <label className="auth-label">Correo electrónico</label>
                <input 
                  type="email" 
                  name="email" 
                  className={`auth-input ${errors.email ? 'error' : ''}`}
                  placeholder="tu@email.com" 
                  value={formData.email} 
                  onChange={handleChange} 
                  required 
                  autoComplete="off"
                />
                {errors.email && <p className="auth-error-text">{errors.email}</p>}
              </div>

              {/* === INFORMACIÓN BÁSICA === */}
              {!isLogin && (
                <div className="form-section">
                  <h4 className="form-section-title">Información Básica</h4>

                  <div className="form-group">
                    <label className="auth-label">Nombre completo</label>
                    <input 
                      type="text" 
                      name="nombreCompleto" 
                      className={`auth-input ${errors.nombreCompleto ? 'error' : ''}`}
                      placeholder="Ej: María González" 
                      value={formData.nombreCompleto} 
                      onChange={handleChange} 
                      required 
                    />
                    {errors.nombreCompleto && <p className="auth-error-text">{errors.nombreCompleto}</p>}
                  </div>

                  <div className="form-group">
                    <label className="auth-label">Teléfono</label>
                    <input 
                      type="tel" 
                      name="telefono" 
                      className={`auth-input ${errors.telefono ? 'error' : ''}`}
                      placeholder="+57 300 123 4567" 
                      value={formData.telefono} 
                      onChange={handleChange} 
                    />
                    {errors.telefono && <p className="auth-error-text">{errors.telefono}</p>}
                  </div>

                  <div className="form-group">
                    <label className="auth-label">Ciudad</label>
                    <input 
                      type="text" 
                      name="ciudad" 
                      className={`auth-input ${errors.ciudad ? 'error' : ''}`}
                      placeholder="Ej: Bogotá" 
                      value={formData.ciudad} 
                      onChange={handleChange} 
                      required 
                    />
                    {errors.ciudad && <p className="auth-error-text">{errors.ciudad}</p>}
                  </div>
                </div>
              )}

              {/* === INFORMACIÓN ADICIONAL (Todos) === */}
              {!isLogin && (
                <div className="form-section">
                  <h4 className="form-section-title">Información Adicional</h4>

                   <div className="form-group">
                     <label className="auth-label">Dirección</label>
                     <input 
                       type="text" 
                       name="direccion" 
                       className={`auth-input ${errors.direccion ? 'error' : ''}`}
                       placeholder="Calle 123 #45-67" 
                       value={formData.direccion} 
                       onChange={handleChange} 
                     />
                     {errors.direccion && <p className="auth-error-text">{errors.direccion}</p>}
                   </div>

                   <div className="form-group">
                     <label className="auth-label">Fecha de nacimiento</label>
                      <input 
                        type="date" 
                        name="fechaNacimiento" 
                        className={`auth-input ${errors.fechaNacimiento ? 'error' : ''}`}
                        value={formData.fechaNacimiento} 
                        onChange={handleChange} 
                        required
                      />
                     {errors.fechaNacimiento && <p className="auth-error-text">{errors.fechaNacimiento}</p>}
                   </div>
 
                    <div className="form-group">
                      <label className="auth-label">
                        {isGroomer ? 'Cuéntanos sobre ti *' : 'Sobre ti (opcional)'}
                      </label>
                       <textarea 
                         name="aboutMe" 
                         className={`auth-textarea ${errors.aboutMe ? 'error' : ''}`}
                         placeholder={
                           isGroomer 
                             ? 'Comparte tu experiencia, certificaciones, especialidades... (mínimo 10 caracteres)' 
                             : 'Cuéntanos sobre tu mascota y tus expectativas'
                         }
                         rows={isGroomer ? 4 : 3}
                         maxLength={isGroomer ? 500 : 50}
                         value={formData.aboutMe} 
                         onChange={handleChange} 
                         required={isGroomer}
                       />
                       <small>{formData.aboutMe.length}/{isGroomer ? 500 : 50}</small>
                       {errors.aboutMe && <p className="auth-error-text">{errors.aboutMe}</p>}
                    </div>
                  </div>
               )}

             <div className="form-group">
               <label className="auth-label">Contraseña</label>
              <div className="auth-password-wrapper">
                 <input 
                   type={showPassword ? 'text' : 'password'} 
                   name="password" 
                   className={`auth-input ${errors.password ? 'error' : ''}`}
                   placeholder="••••••••" 
                   value={formData.password} 
                   onChange={handleChange} 
                   required 
                 />
                <button 
                  type="button" 
                  className="password-toggle" 
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9 9 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 0 4.24 4.24"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  )}
                 </button>
               </div>
               {errors.password && <p className="auth-error-text">{errors.password}</p>}
             </div>

             {/* Confirmar contraseña solo en registro */}
            {!isLogin && (
              <div className="form-group">
                <label className="auth-label">Confirmar contraseña</label>
                <div className="auth-password-wrapper">
                   <input 
                     type={showPassword ? 'text' : 'password'} 
                     className={`auth-input ${errors.confirmPassword ? 'error' : ''}`}
                     placeholder="••••••••" 
                     value={confirmPassword} 
                     onChange={handleConfirmPasswordChange} 
                     required 
                   />
                 </div>
                 {errors.confirmPassword && <p className="auth-error-text">{errors.confirmPassword}</p>}
               </div>
             )}

             {/* Recordarme - solo visible en login o siempre */}
             {isLogin && (
               <div className="form-options">
                 <label className="remember-me">
                   <input 
                     type="checkbox" 
                     checked={rememberMe} 
                     onChange={(e) => setRememberMe(e.target.checked)} 
                   />
                   <span>Recordarme</span>
                 </label>
               </div>
             )}

              {/* Selector temporal para pruebas (solo login) */}


              <button 
               type="submit" 
               className="auth-button" 
                disabled={
                  isLoading || 
                  (!isLogin && (
                    !formData.nombreCompleto?.trim() ||
                    !formData.email?.trim() ||
                    !formData.telefono?.trim() ||
                    !formData.direccion?.trim() ||
                    !formData.ciudad?.trim() ||
                    !formData.password ||
                    !confirmPassword ||
                    !formData.fechaNacimiento
                  ))
                }
             >
              {isLoading 
                ? (isLogin ? 'Iniciando sesión...' : isGroomer ? 'Enviando solicitud...' : 'Creando cuenta...') 
                : (isLogin ? 'Iniciar Sesión' : isGroomer ? 'Enviar Solicitud' : 'Crear Cuenta')
              }
            </button>

            {/* Botones de OAuth (Google/Facebook) */}
            <OAuthButtons 
              onSuccess={(user) => {
                saveSession(null, user, user.role);
                navigate(user.role === 'groomer' ? '/groomer' : '/client');
              }}
            />
          </form>

          <div className="auth-footer" style={{ textAlign: 'center' }}>
            {isLogin ? (
              <>
                <p style={{ marginBottom: '12px', fontSize: '14px', color: 'var(--text-secondary, #666)' }}>
                  <span 
                    onClick={() => navigate('/reset-password')} 
                    style={{ 
                      color: '#e07a5f', 
                      cursor: 'pointer', 
                      textDecoration: 'none',
                      fontWeight: '600',
                      transition: 'all 0.2s',
                      borderBottom: '2px solid transparent'
                    }}
                    onMouseOver={(e) => {
                      e.target.style.color = '#c96a52';
                      e.target.style.borderBottom = '2px solid #c96a52';
                    }}
                    onMouseOut={(e) => {
                      e.target.style.color = '#e07a5f';
                      e.target.style.borderBottom = '2px solid transparent';
                    }}
                  >
                    ¿Olvidaste tu contraseña?
                  </span>
                </p>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary, #666)' }}>
                  ¿No tienes cuenta? 
                  <span 
                    onClick={toggleMode}
                    style={{ 
                      color: '#e07a5f', 
                      cursor: 'pointer', 
                      textDecoration: 'none',
                      fontWeight: '600',
                      marginLeft: '4px',
                      transition: 'all 0.2s',
                      borderBottom: '2px solid transparent'
                    }}
                    onMouseOver={(e) => {
                      e.target.style.color = '#c96a52';
                      e.target.style.borderBottom = '2px solid #c96a52';
                    }}
                    onMouseOut={(e) => {
                      e.target.style.color = '#e07a5f';
                      e.target.style.borderBottom = '2px solid transparent';
                    }}
                  >
                    Regístrate aquí
                  </span>
                </p>
              </>
            ) : (
              <p style={{ fontSize: '14px', color: 'var(--text-secondary, #666)' }}>
                ¿Ya tienes cuenta? 
                <span 
                  onClick={toggleMode}
                  style={{ 
                    color: '#e07a5f', 
                    cursor: 'pointer', 
                    textDecoration: 'none',
                    fontWeight: '600',
                    marginLeft: '4px',
                    transition: 'all 0.2s',
                    borderBottom: '2px solid transparent'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.color = '#c96a52';
                    e.target.style.borderBottom = '2px solid #c96a52';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.color = '#e07a5f';
                    e.target.style.borderBottom = '2px solid transparent';
                  }}
                >
                  Inicia sesión
                </span>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
