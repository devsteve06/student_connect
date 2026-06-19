import apiClient from './apiClient';

export const universityService = {
  // Fetch high-level institutional metrics
  getCoordinatorMetrics: async () => {
    const response = await apiClient.get('/api/v1/university/metrics');
    return response.data;
  },

  // Fetch logbooks across all students that require faculty sign-off
  getPendingLogbooks: async () => {
    const response = await apiClient.get('/api/v1/university/logbooks/pending');
    return response.data;
  },

  // Authorizes a logbook entry week with official faculty sign-off status
  signOffLogbook: async (id, status) => {
    const response = await apiClient.patch(`/api/v1/university/logbooks/${id}`, { facultySignOff: status });
    return response.data;
  }
};