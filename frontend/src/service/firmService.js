// src/services/firmService.js
import apiClient from './apiClient';

export const firmService = {
  // Fetches high-level metrics for the corporate dashboard
  getFirmMetrics: async () => {
    const response = await apiClient.get('/api/v1/firm/metrics');
    return response.data;
  },

  // Fetches the roster of students who have applied to this firm
  getApplicants: async () => {
    const response = await apiClient.get('/api/v1/firm/applicants');
    return response.data;
  },

  // Updates an applicant's status (e.g., Shortlisted, Interviewing, Approved)
  updateApplicantStatus: async (id, status) => {
    const response = await apiClient.patch(`/api/v1/firm/applicants/${id}`, { status });
    return response.data;
  }
};