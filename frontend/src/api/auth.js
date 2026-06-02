import { API_BASE, fetchWithTimeout } from './config';
import { tokenStore } from './tokenStore';

function getErrorMessage(errorData, defaultMessage) {
  if (!errorData) return defaultMessage;

  const detail = errorData.detail;

  if (typeof detail === 'string') {
    return detail;
  }

  if (Array.isArray(detail) && detail.length > 0) {
    const first = detail[0];
    if (first.msg) {
      const field = first.loc && first.loc[1] ? ` (campo: ${first.loc[1]})` : '';
      return `${first.msg}${field}`;
    }
    return 'Error de validación en los datos enviados';
  }

  return defaultMessage;
}

export async function getAllUsers() {
  const res = await fetchWithTimeout(`${API_BASE}/auth/users/all`, {
    headers: tokenStore.getAuthHeader(),
    timeout: 5000
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'No pudimos cargar la lista de usuarios. Por favor, intenta nuevamente.');
  }
  return res.json();
}

// === Admin user management ===
export async function getAllUsersAdmin() {
  const res = await fetchWithTimeout(`${API_BASE}/auth/admin/users/all`, {
    headers: tokenStore.getAuthHeader(),
    timeout: 8000
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'No pudimos cargar la lista de usuarios (admin).');
  }
  return res.json();
}

export async function getAdminUserStats() {
  const res = await fetchWithTimeout(`${API_BASE}/auth/admin/users/stats`, {
    headers: tokenStore.getAuthHeader(),
    timeout: 8000,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'No pudimos cargar las estadísticas de usuarios (admin).');
  }
  return res.json();
}

export async function adminUpdateUser(userId, payload) {
  const res = await fetchWithTimeout(`${API_BASE}/auth/admin/users/${userId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...tokenStore.getAuthHeader(),
    },
    body: JSON.stringify(payload),
    timeout: 8000
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'No pudimos actualizar el usuario.');
  }
  return res.json();
}

export async function adminUpdateUserRole(userId, role) {
  const res = await fetchWithTimeout(`${API_BASE}/auth/admin/users/${userId}/role`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...tokenStore.getAuthHeader(),
    },
    body: JSON.stringify({ role }),
    timeout: 8000
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'No pudimos actualizar el rol del usuario.');
  }
  return res.json();
}

export async function adminUpdateUserStatus(userId, isActive) {
  const res = await fetchWithTimeout(`${API_BASE}/auth/admin/users/${userId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...tokenStore.getAuthHeader(),
    },
    body: JSON.stringify({ is_active: isActive }),
    timeout: 8000
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'No pudimos actualizar el estado del usuario.');
  }
  return res.json();
}

export async function adminDeleteUser(userId) {
  const res = await fetchWithTimeout(`${API_BASE}/auth/admin/users/${userId}`, {
    method: 'DELETE',
    headers: tokenStore.getAuthHeader(),
    timeout: 8000
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'No pudimos eliminar el usuario.');
  }
  return res.json();
}

export async function getUserByEmail(email) {
  const res = await fetchWithTimeout(`${API_BASE}/auth/users/${email}`, {
    headers: tokenStore.getAuthHeader(),
    timeout: 5000
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'No pudimos cargar la información del usuario. Por favor, intenta nuevamente.');
  }
  return res.json();
}

export async function loginUser(email, password) {
  const res = await fetchWithTimeout(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
    timeout: 5000
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(getErrorMessage(errorData, 'No pudimos iniciar sesión. Por favor, verifica tus credenciales e intenta nuevamente.'));
  }

  return res.json(); // { access_token, token_type, user }
}

export async function registerUser({
  nombreCompleto,
  email,
  telefono,
  direccion,
  password,
  ciudad,
  fotoUrl,
  aboutMe,
  fechaNacimiento,
}) {
  const res = await fetchWithTimeout(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nombre_completo: nombreCompleto?.trim(),
      email: email?.trim(),
      telefono: telefono?.trim(),
      direccion: direccion?.trim(),
      ciudad: ciudad?.trim() || null,
      foto_url: fotoUrl || null,
      about_me: aboutMe || null,
      fecha_nacimiento: fechaNacimiento,   // date string from <input type="date">
      password: password,
    }),
    timeout: 8000
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(getErrorMessage(errorData, 'No pudimos crear tu cuenta. Por favor, verifica los datos e intenta nuevamente.'));
  }

  return res.json(); // { access_token, token_type, user } - auto-login token
}

// Submit groomer application (pendiente de aprobación)
export async function submitGroomerApplication({
  email,
  nombreCompleto,
  telefono,
  password,
  ciudad,
  direccion,
  fechaNacimiento,
  fotoUrl,
  aboutMe,
}) {
  const payload = {
    email: email?.trim(),
    nombre_completo: nombreCompleto?.trim(),
    telefono: telefono?.trim(),
    password,
    ciudad: ciudad?.trim() || '',
    direccion: direccion?.trim() || '',
    fecha_nacimiento: fechaNacimiento,
    foto_url: fotoUrl || '',
    about_me: aboutMe || '',
  };

  console.log('Enviando solicitud de groomer:', payload);

  const res = await fetchWithTimeout(`${API_BASE}/auth/groomer-application`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    timeout: 8000
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    console.error('Error del backend:', errorData);
    console.error('Detalles de errores:', JSON.stringify(errorData.errors, null, 2));
    
    // Mostrar errores específicos de validación
    if (errorData.errors && Array.isArray(errorData.errors)) {
      const errorMessages = errorData.errors.map(err => 
        err.msg || err.message || JSON.stringify(err)
      ).join(', ');
      throw new Error(errorMessages || 'No pudimos enviar tu solicitud. Por favor, verifica los datos e intenta nuevamente.');
    }
    
    throw new Error(getErrorMessage(errorData, 'No pudimos enviar tu solicitud. Por favor, verifica los datos e intenta nuevamente.'));
  }

  return res.json();
}

// Validar el registro usando login automático
export async function validateRegistrationLogin(email, password) {
  try {
    const loginResult = await loginUser(email, password);
    return {
      success: true,
      data: loginResult,
      message: 'Registro validado exitosamente mediante login automático'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      message: 'No pudimos validar el registro con login automático'
    };
  }
}

// === Perfil del usuario autenticado (desde Auth Service / BD real) ===
export async function getCurrentUserProfile(token) {
  const res = await fetchWithTimeout(`${API_BASE}/auth/me`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    timeout: 5000
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'No pudimos cargar tu perfil. Por favor, intenta nuevamente.');
  }

  return res.json();
}

export async function updateCurrentUserProfile(profileData, token) {
  const res = await fetchWithTimeout(`${API_BASE}/auth/me`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(profileData),
    timeout: 8000
  });

  if (!res.ok) {
    const text = await res.text().catch(() => null);
    let msg = text || (await res.json().catch(() => ({}))).detail || 'No pudimos actualizar tu perfil. Por favor, verifica los datos e intenta nuevamente.';
    throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
  }

  return res.json();
}

// Función de conveniencia que usa el token del tokenStore
export async function updateUserProfile(profileData) {
  const token = tokenStore.getToken();
  if (!token) {
    throw new Error('No hay sesión activa. Por favor, inicia sesión nuevamente.');
  }
  return updateCurrentUserProfile(profileData, token);
}

export async function changePassword(currentPassword, newPassword, token) {
  const res = await fetchWithTimeout(`${API_BASE}/auth/change-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      current_password: currentPassword,
      new_password: newPassword,
    }),
    timeout: 5000
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'No pudimos cambiar tu contraseña. Por favor, verifica los datos e intenta nuevamente.');
  }

  return res.json();
}

// Get groomer applications (list with optional status filter)
export async function getGroomerApplications(token, status = 'pending') {
  const res = await fetch(`${API_BASE}/auth/groomer-applications?status_filter=${status}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'No pudimos cargar las solicitudes. Por favor, intenta nuevamente.');
  }

  return res.json();
}

// Get groomer application details
export async function getGroomerApplication(token, applicationId) {
  const res = await fetch(`${API_BASE}/auth/groomer-applications/${applicationId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'No pudimos cargar la solicitud. Por favor, intenta nuevamente.');
  }

  return res.json();
}

// Approve groomer application
export async function approveGroomerApplication(token, applicationId) {
  const res = await fetch(`${API_BASE}/auth/groomer-applications/${applicationId}/approve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'No pudimos aprobar la solicitud. Por favor, intenta nuevamente.');
  }

  return res.json();
}

// Reject groomer application
export async function rejectGroomerApplication(token, applicationId, rejectionReason) {
  const res = await fetch(`${API_BASE}/auth/groomer-applications/${applicationId}/reject`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      admin_id: 1, // Se obtendría del contexto en producción
      application_id: applicationId,
      rejection_reason: rejectionReason,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'No pudimos rechazar la solicitud. Por favor, intenta nuevamente.');
  }

  return res.json();
}

// ===== OAUTH FUNCTIONS =====

export async function getGoogleOAuthUrl() {
  const res = await fetchWithTimeout(`${API_BASE}/auth/google/login`, {
    method: 'GET',
    timeout: 5000
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'No pudimos obtener la URL de autenticación de Google.');
  }

  return res.json(); // { auth_url }
}

export async function googleOAuthCallback(code, state = null) {
  const res = await fetchWithTimeout(`${API_BASE}/auth/google/callback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, state }),
    timeout: 8000
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'No pudimos completar la autenticación con Google.');
  }

  return res.json(); // { access_token, token_type, user }
}

// ===== PASSWORD RESET FUNCTIONS =====

export async function requestPasswordReset(email) {
  const res = await fetchWithTimeout(`${API_BASE}/auth/password-reset/request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
    timeout: 5000
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'No pudimos solicitar la recuperación de contraseña.');
  }

  return res.json(); // { message, reset_url }
}

export async function confirmPasswordReset(token, newPassword) {
  const res = await fetchWithTimeout(`${API_BASE}/auth/password-reset/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, new_password: newPassword }),
    timeout: 5000
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'No pudimos restablecer la contraseña.');
  }

  return res.json(); // { message }
}
