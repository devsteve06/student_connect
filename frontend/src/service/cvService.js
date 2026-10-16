// src/services/cvService.js
import apiClient from './apiClient';

export const cvService = {
  // Every path uses the full /api/v1/... prefix (see AGENTS.md).
  listCvs: async () => {
    const response = await apiClient.get('/api/v1/students/cv');
    return response.data;
  },

  createCv: async (cvPayload) => {
    const response = await apiClient.post('/api/v1/students/cv', cvPayload);
    return response.data;
  },

  getCv: async (cvId) => {
    const response = await apiClient.get(`/api/v1/students/cv/${cvId}`);
    return response.data;
  },

  updateCv: async (cvId, cvPayload) => {
    const response = await apiClient.patch(`/api/v1/students/cv/${cvId}`, cvPayload);
    return response.data;
  },

  deleteCv: async (cvId) => {
    const response = await apiClient.delete(`/api/v1/students/cv/${cvId}`);
    return response.data;
  },

  // Promote a CV to primary — only meaningful when editing an existing CV.
  setPrimaryCv: async (cvId) => {
    const response = await apiClient.post(`/api/v1/students/cv/${cvId}/primary`);
    return response.data;
  }
};
