// src/service/authService.js
// Real authentication for the student, firm, and university portals.
// Mirrors adminService: hits the shared /auth endpoints, verifies the role,
// and stores the JWT under the same 'token' key apiClient reads from.
import apiClient from './apiClient';

const TOKEN_KEY = 'token';
const PROFILE_KEY = 'profile';

const persist = (data) => {
  localStorage.setItem(TOKEN_KEY, data.token);
  localStorage.setItem(
    PROFILE_KEY,
    JSON.stringify({ id: data._id, name: data.name, email: data.email, role: data.role })
  );
};

export const authService = {
  // Authenticate with email + password. When expectedRole is given, reject
  // accounts that belong to a different portal so a firm can't sign into /student.
  login: async (email, password, expectedRole) => {
    const { data } = await apiClient.post('/api/v1/auth/login', {
      email: email.trim().toLowerCase(),
      password
    });
    if (expectedRole && data.role !== expectedRole) {
      throw new Error(`This account is not registered as a ${expectedRole}.`);
    }
    persist(data);
    return data;
  },

  // Create a student / firm / university account, then sign in with the
  // token the backend returns on registration.
  register: async (payload) => {
    const { data } = await apiClient.post('/api/v1/auth/register', {
      ...payload,
      email: payload.email?.trim().toLowerCase()
    });
    persist(data);
    return data;
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(PROFILE_KEY);
  },

  isAuthenticated: () => Boolean(localStorage.getItem(TOKEN_KEY)),

  getProfile: () => {
    try {
      return JSON.parse(localStorage.getItem(PROFILE_KEY)) || null;
    } catch {
      return null;
    }
  }
};

export default authService;
