// src/services/apiClient.js
import axios from 'axios';
import sessionStore from './sessionStore';

const apiClient = axios.create({
  // Backend API. Override with VITE_API_BASE_URL (see frontend/.env).
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Attach the stored JWT (set at login) to every request so protected routes
// — e.g. the admin surface — authenticate automatically.
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Expired or invalid tokens: wipe the session and send the user to the
// sign-in screen for the portal they were browsing. Failed login/register
// attempts are expected 401s, so those are left for the page to display.
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || '';
    const isAuthAttempt = url.includes('/auth/login') || url.includes('/auth/register');

    if ((status === 401 || status === 403) && !isAuthAttempt) {
      sessionStore.clear();
      const path = window.location.pathname;
      if (!path.startsWith('/login')) {
        const portal = path.startsWith('/firm')
          ? 'firm'
          : path.startsWith('/university')
            ? 'university'
            : path.startsWith('/admin')
              ? 'admin'
              : 'student';
        window.location.assign(`/login/${portal}`);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
