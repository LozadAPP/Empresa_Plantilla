import api from './api';
import { Alert, CreateAlertDto, AlertStats } from '../types/alert';

const BASE_URL = '/alerts';

export const alertService = {
  getAlerts: async (params?: {
    alertType?: string;
    severity?: string;
    isRead?: boolean;
    isResolved?: boolean;
    assignedTo?: number;
    page?: number;
    limit?: number;
  }) => {
    const response = await api.get<{
      success: boolean;
      data: Alert[];
      pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      };
    }>(BASE_URL, { params });
    return response.data;
  },

  getAlertById: async (id: number) => {
    const response = await api.get<{ success: boolean; data: Alert }>(`${BASE_URL}/${id}`);
    return response.data;
  },

  getAlertStats: async () => {
    const response = await api.get<{ success: boolean; data: AlertStats }>(`${BASE_URL}/stats`);
    return response.data;
  },

  getAlertTrends: async (days: number = 7) => {
    const response = await api.get<{
      success: boolean;
      data: {
        labels: string[];
        datasets: {
          critical: number[];
          warning: number[];
          info: number[];
          total: number[];
        };
      };
    }>(`${BASE_URL}/trends`, { params: { days } });
    return response.data;
  },

  createAlert: async (data: CreateAlertDto) => {
    const response = await api.post<{ success: boolean; data: Alert }>(BASE_URL, data);
    return response.data;
  },

  markAsRead: async (id: number) => {
    const response = await api.post<{ success: boolean; data: Alert }>(`${BASE_URL}/${id}/read`);
    return response.data;
  },

  markAsUnread: async (id: number) => {
    const response = await api.post<{ success: boolean; data: Alert }>(`${BASE_URL}/${id}/unread`);
    return response.data;
  },

  resolveAlert: async (id: number) => {
    const response = await api.post<{ success: boolean; data: Alert }>(`${BASE_URL}/${id}/resolve`);
    return response.data;
  },

  deleteAlert: async (id: number) => {
    const response = await api.delete<{ success: boolean }>(`${BASE_URL}/${id}`);
    return response.data;
  },
};

export default alertService;
