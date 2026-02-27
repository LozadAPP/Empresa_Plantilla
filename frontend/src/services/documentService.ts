import api from './api';
import { DocumentFilters } from '../types/document';

const documentService = {
  getAll: (filters?: DocumentFilters) =>
    api.get('/documents', { params: filters }),

  getById: (id: number) =>
    api.get(`/documents/${id}`),

  getByEntity: (entityType: string, entityId: number) =>
    api.get(`/documents/entity/${entityType}/${entityId}`),

  getStatistics: () =>
    api.get('/documents/statistics'),

  upload: (formData: FormData) =>
    api.post('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  download: async (id: number): Promise<Blob> => {
    const response = await api.get(`/documents/${id}/download`, { responseType: 'blob' });
    return response.data;
  },

  update: (id: number, data: { name?: string; description?: string; category?: string }) =>
    api.put(`/documents/${id}`, data),

  softDelete: (id: number) =>
    api.delete(`/documents/${id}`),
};

export default documentService;
