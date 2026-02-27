/**
 * Servicio API para Prospectos (CRM)
 */
import api from './api';
import {
  CreateLeadDTO,
  UpdateLeadDTO,
  LeadFilters,
  LeadResponse,
  SingleLeadResponse,
  LeadStatistics,
  ConvertLeadResponse,
  LeadActivity,
} from '../types/lead';

export const leadService = {
  /**
   * Obtener todos los prospectos con filtros opcionales
   */
  getAll: async (filters?: LeadFilters): Promise<LeadResponse> => {
    const response = await api.get<LeadResponse>('/leads', {
      params: filters,
    });
    return response.data;
  },

  /**
   * Obtener un prospecto por ID
   */
  getById: async (id: number): Promise<SingleLeadResponse> => {
    const response = await api.get<SingleLeadResponse>(`/leads/${id}`);
    return response.data;
  },

  /**
   * Obtener estadisticas del pipeline
   */
  getStatistics: async (): Promise<LeadStatistics> => {
    const response = await api.get<LeadStatistics>('/leads/statistics');
    return response.data;
  },

  /**
   * Crear nuevo prospecto
   */
  create: async (data: CreateLeadDTO): Promise<SingleLeadResponse> => {
    const response = await api.post<SingleLeadResponse>('/leads', data);
    return response.data;
  },

  /**
   * Actualizar prospecto
   */
  update: async (id: number, data: UpdateLeadDTO): Promise<SingleLeadResponse> => {
    const response = await api.put<SingleLeadResponse>(`/leads/${id}`, data);
    return response.data;
  },

  /**
   * Eliminar prospecto (solo si status=new)
   */
  delete: async (id: number): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete<{ success: boolean; message: string }>(`/leads/${id}`);
    return response.data;
  },

  /**
   * Cambiar status del prospecto
   */
  changeStatus: async (id: number, status: string, lostReason?: string): Promise<SingleLeadResponse> => {
    const response = await api.patch<SingleLeadResponse>(`/leads/${id}/status`, {
      status,
      lostReason,
    });
    return response.data;
  },

  /**
   * Convertir prospecto ganado a cliente
   */
  convertToCustomer: async (id: number, createQuote?: boolean): Promise<ConvertLeadResponse> => {
    const response = await api.post<ConvertLeadResponse>(`/leads/${id}/convert`, {
      createQuote,
    });
    return response.data;
  },

  /**
   * Obtener actividades de un prospecto
   */
  getActivities: async (id: number): Promise<{ success: boolean; data: LeadActivity[] }> => {
    const response = await api.get<{ success: boolean; data: LeadActivity[] }>(`/leads/${id}/activities`);
    return response.data;
  },

  /**
   * Agregar actividad a un prospecto
   */
  addActivity: async (
    id: number,
    data: { activityType: string; description: string; scheduledAt?: string }
  ): Promise<{ success: boolean; data: LeadActivity; message: string }> => {
    const response = await api.post<{ success: boolean; data: LeadActivity; message: string }>(
      `/leads/${id}/activities`,
      data
    );
    return response.data;
  },

  /**
   * Completar actividad
   */
  completeActivity: async (
    leadId: number,
    activityId: number
  ): Promise<{ success: boolean; data: LeadActivity; message: string }> => {
    const response = await api.patch<{ success: boolean; data: LeadActivity; message: string }>(
      `/leads/${leadId}/activities/${activityId}/complete`
    );
    return response.data;
  },
};

export default leadService;
