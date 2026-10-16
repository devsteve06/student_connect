// src/services/studentServices.js
import apiClient from './apiClient';

export const studentService = {
  getMetrics: async () => {
    // Explicit path declaration bypasses string truncation bugs
    const response = await apiClient.get('/api/v1/students/metrics');
    return response.data;
  },

  getApplications: async () => {
    // Explicit path declaration bypasses string truncation bugs
    const response = await apiClient.get('/api/v1/students/applications');
    return response.data;
  },

  //  Fetch available corporate vacancy postings
  getPlacements: async () => {
    const response = await apiClient.get('/api/v1/students/placements');
    return response.data;
  },

  // Fetch the student's own personal details
  getProfile: async () => {
    const response = await apiClient.get('/api/v1/students/profile');
    return response.data;
  },

  // Update personal details (fullName, phone, email)
  updateProfile: async (profilePayload) => {
    const response = await apiClient.patch('/api/v1/students/profile', profilePayload);
    return response.data;
  },

  // Submit a new attachment application payload
  applyForPlacement: async (applicationPayload) => {
    const response = await apiClient.post('/api/v1/students/applications', applicationPayload);
    return response.data;
  },

  // Fetch the student's own weekly logbook entries
  getLogbooks: async () => {
    const response = await apiClient.get('/api/v1/students/logbooks');
    return response.data;
  },

  // Submit or update a weekly logbook entry (upserts by week_number)
  upsertLogbook: async (logbookPayload) => {
    const response = await apiClient.put('/api/v1/students/logbooks', logbookPayload);
    return response.data;
  }

};