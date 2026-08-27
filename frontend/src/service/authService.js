// src/service/authService.js
// Real authentication for the student, firm, and university portals.
// Hits the shared /auth endpoints, verifies the role, and persists the
// session through sessionStore so all portals share one storage layout.
import apiClient from './apiClient';
import sessionStore from './sessionStore';

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
    sessionStore.save(data);
    return data;
  },

  // Create a student / firm / university account, then sign in with the
  // token the backend returns on registration.
  register: async (payload) => {
    const { data } = await apiClient.post('/api/v1/auth/register', {
      ...payload,
      email: payload.email?.trim().toLowerCase()
    });
    sessionStore.save(data);
    return data;
  },

  logout: () => sessionStore.clear(),

  isAuthenticated: () => sessionStore.isAuthenticated(),

  getProfile: () => sessionStore.getProfile()
};

export default authService;
