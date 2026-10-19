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

  // Admin preview: name the account to act as. The server allows an admin into
  // another portal only through these headers, only on GETs (it refuses to
  // attribute a write to the account being viewed), and the /admin routes
  // ignore them — so an active preview never affects the admin's own surface.
  const preview = sessionStore.getPreview();
  if (preview?.role && preview?.id) {
    config.headers['X-View-As-Role'] = preview.role;
    config.headers['X-View-As-Id'] = String(preview.id);
  }

  // Don't set Content-Type for multipart requests; let the browser
  // include the correct boundary. Never override if the caller explicitly
  // provided multipart.
  if (config.data instanceof FormData) {
    if (config.headers && config.headers['Content-Type'] === 'application/json') {
      delete config.headers['Content-Type'];
    }
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
    // While previewing, a 403 means "that action is not allowed in preview"
    // (the API refuses writes) — not "your session is invalid", so the admin
    // must not be signed out of the admin session for pressing a button.
    const previewing = Boolean(sessionStore.getPreview());

    if ((status === 401 || (status === 403 && !previewing)) && !isAuthAttempt) {
      sessionStore.clear();
      const path = window.location.pathname;
      if (!path.startsWith('/login')) {
        const portal = path.startsWith('/firms')
          ? 'firm'
          : path.startsWith('/universities')
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
