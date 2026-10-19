// src/services/firmService.js
import apiClient from './apiClient';

export const firmService = {
  // Fetches high-level metrics for the corporate dashboard
  getFirmMetrics: async () => {
    const response = await apiClient.get('/api/v1/firms/metrics');
    return response.data;
  },

  // Fetches the roster of students who have applied to this firm
  getApplicants: async () => {
    const response = await apiClient.get('/api/v1/firms/applicants');
    return response.data;
  },

  // Updates an applicant's status (e.g., Shortlisted, Interviewing, Approved)
  updateApplicantStatus: async (id, status) => {
    const response = await apiClient.patch(`/api/v1/firms/applicants/${id}`, { status });
    return response.data;
  },

  // --- Job postings (JOB_POSTING_PLAN.md Phase 3) ---

  // Lists this firm's postings (newest first) with a live applicantCount
  listPlacements: async () => {
    const response = await apiClient.get('/api/v1/firms/placements');
    return response.data;
  },

  // Publishes a new posting; the API always stores it as 'Open'
  createPlacement: async (payload) => {
    const response = await apiClient.post('/api/v1/firms/placements', payload);
    return response.data;
  },

  // Edits an Open posting (closed postings return 409 from the API)
  updatePlacement: async (id, payload) => {
    const response = await apiClient.patch(`/api/v1/firms/placements/${id}`, payload);
    return response.data;
  },

  // Manually closes a posting (idempotent)
  closePlacement: async (id) => {
    const response = await apiClient.patch(`/api/v1/firms/placements/${id}/close`);
    return response.data;
  }
};