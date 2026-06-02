import { API, fetchWithTimeout } from './config';
import { tokenStore } from './tokenStore';

export async function getMyProfile() {
  try {
    const url = `${API.userProfile}/profiles/me`;
    console.log('Fetching profile from:', url);

    const res = await fetchWithTimeout(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...tokenStore.getAuthHeader(),
      },
      timeout: 5000
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const errorMsg = err.detail || err.message || `HTTP ${res.status}`;
      console.error('Profile fetch failed:', { status: res.status, error: errorMsg });
      throw new Error(errorMsg);
    }

    const data = await res.json();
    console.log('Profile loaded successfully:', data);
    return data;
  } catch (error) {
    console.error('Error loading profile:', error);
    throw error;
  }
}

export async function updateMyProfile(profileUpdate) {
  try {
    const url = `${API.userProfile}/profiles/me`;
    console.log('Updating profile at:', url);

    const res = await fetchWithTimeout(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...tokenStore.getAuthHeader(),
      },
      body: JSON.stringify(profileUpdate),
      timeout: 8000
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const errorMsg = err.detail || err.message || `HTTP ${res.status}`;
      console.error('Profile update failed:', { status: res.status, error: errorMsg });
      throw new Error(errorMsg);
    }

    const data = await res.json();
    console.log('Profile updated successfully:', data);
    return data;
  } catch (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
}


