// src/services/apiClient.js
import axios from 'axios';

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

export default apiClient;
