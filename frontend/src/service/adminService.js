// src/services/adminService.js
import apiClient from './apiClient';

const TOKEN_KEY = 'token';
const ADMIN_KEY = 'admin';

export const adminService = {
  // Authenticate with the admin username (e.g. "sysadmin") + password.
  // Stores the JWT so subsequent admin calls are authorized.
  login: async (username, password) => {
    const { data } = await apiClient.post('/api/v1/auth/login', { email: username, password });
    if (data.role !== 'admin') {
      throw new Error('This account does not have administrator privileges.');
    }
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(ADMIN_KEY, JSON.stringify({ id: data._id, name: data.name, email: data.email }));
    return data;
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ADMIN_KEY);
  },

  isAuthenticated: () => Boolean(localStorage.getItem(TOKEN_KEY)),

  getProfile: () => {
    try {
      return JSON.parse(localStorage.getItem(ADMIN_KEY)) || null;
    } catch {
      return null;
    }
  },

  // List every account across all role tables.
  getUsers: async () => {
    const { data } = await apiClient.get('/api/v1/admin/users');
    return data;
  },

  // Create an account of any role.
  createUser: async (payload) => {
    const { data } = await apiClient.post('/api/v1/admin/users', payload);
    return data;
  },

  // Reset any party's password.
  resetPassword: async (role, id, newPassword) => {
    const { data } = await apiClient.post('/api/v1/admin/reset-password', { role, id, newPassword });
    return data;
  },

  // Delete any account.
  deleteUser: async (role, id) => {
    const { data } = await apiClient.delete(`/api/v1/admin/users/${role}/${id}`);
    return data;
  }
};
