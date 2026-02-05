import api from './api';
import {
  ExtraService,
  CreateExtraServiceDto,
  UpdateExtraServiceDto,
  ExtraServiceFilters,
  ServicesByCategory,
} from '../types/extraService';

const BASE_URL = '/extra-services';

export const extraServiceService = {
  // Get active services (for rental form)
  getActiveServices: async (params?: ExtraServiceFilters) => {
    const response = await api.get<{ success: boolean; data: ExtraService[] }>(
      BASE_URL,
      { params }
    );
    return response.data;
  },

  // Get all services including inactive (admin)
  getAllServices: async (params?: ExtraServiceFilters) => {
    const response = await api.get<{ success: boolean; data: ExtraService[] }>(
      `${BASE_URL}/all`,
      { params }
    );
    return response.data;
  },

  // Get single service by ID
  getServiceById: async (id: number) => {
    const response = await api.get<{ success: boolean; data: ExtraService }>(
      `${BASE_URL}/${id}`
    );
    return response.data;
  },

  // Get services grouped by category
  getServicesByCategory: async () => {
    const response = await api.get<{ success: boolean; data: ServicesByCategory }>(
      `${BASE_URL}/by-category`
    );
    return response.data;
  },

  // Create new service (admin)
  createService: async (data: CreateExtraServiceDto) => {
    const response = await api.post<{ success: boolean; data: ExtraService; message: string }>(
      BASE_URL,
      data
    );
    return response.data;
  },

  // Update service (admin)
  updateService: async (id: number, data: UpdateExtraServiceDto) => {
    const response = await api.put<{ success: boolean; data: ExtraService; message: string }>(
      `${BASE_URL}/${id}`,
      data
    );
    return response.data;
  },

  // Toggle service active status (admin)
  toggleServiceStatus: async (id: number) => {
    const response = await api.patch<{ success: boolean; data: ExtraService; message: string }>(
      `${BASE_URL}/${id}/toggle`
    );
    return response.data;
  },

  // Delete service (admin)
  deleteService: async (id: number) => {
    const response = await api.delete<{ success: boolean; message: string }>(
      `${BASE_URL}/${id}`
    );
    return response.data;
  },
};

export default extraServiceService;
