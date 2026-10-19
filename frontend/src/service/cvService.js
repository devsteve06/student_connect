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
  },

  // Phase 4 — score a CV against a job (placementId or pasted job title/description).
  analyzeCv: async (analysisPayload) => {
    const response = await apiClient.post('/api/v1/students/cv/analyze', analysisPayload);
    return response.data;
  },

  // Phase 4 — the student's past analysis runs, newest first.
  getAnalyses: async () => {
    const response = await apiClient.get('/api/v1/students/cv/analyses');
    return response.data;
  },

  // Upload an existing CV (PDF or plain text). Returns the parsed draft the
  // server saved, so the caller can open it in the wizard. Multiplying the
  // timeout gives the server room to extract a large PDF.
  uploadCv: async (file) => {
    const form = new FormData();
    form.append('file', file);
    const response = await apiClient.post('/api/v1/students/cv/upload', form, {
      timeout: 60000
    });
    return response.data;
  }
};
