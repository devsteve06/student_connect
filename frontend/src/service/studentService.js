// src/services/studentServices.js
import apiClient from './apiClient';

export const studentService = {
  getMetrics: async () => {
    // Explicit path declaration bypasses string truncation bugs
    const response = await apiClient.get('/api/v1/student/metrics');
    return response.data;
  },

  getApplications: async () => {
    // Explicit path declaration bypasses string truncation bugs
    const response = await apiClient.get('/api/v1/student/applications');
    return response.data;
  },

  //  Fetch available corporate vacancy postings
  getPlacements: async () => {
    const response = await apiClient.get('/api/v1/student/placements');
    return response.data;
  },

  // Submit a new attachment application payload
  applyForPlacement: async (applicationPayload) => {
    const response = await apiClient.post('/api/v1/student/applications', applicationPayload);
    return response.data;
  }

};