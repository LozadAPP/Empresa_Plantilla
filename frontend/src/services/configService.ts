import api from './api';
import { SystemConfig, PriceConfig, CreatePriceConfigDto } from '../types/config';

const BASE_URL = '/config';

export const configService = {
  // System Configuration
  getSystemConfigs: async (params?: { category?: string }) => {
    const response = await api.get<{ success: boolean; data: SystemConfig[] }>(
      `${BASE_URL}/system`,
      { params }
    );
    return response.data;
  },

  getConfigByKey: async (key: string) => {
    const response = await api.get<{ success: boolean; data: SystemConfig }>(
      `${BASE_URL}/system/key/${key}`
    );
    return response.data;
  },

  createSystemConfig: async (data: Partial<SystemConfig>) => {
    const response = await api.post<{ success: boolean; data: SystemConfig }>(
      `${BASE_URL}/system`,
      data
    );
    return response.data;
  },

  updateSystemConfig: async (id: number, data: { configValue: string; description?: string }) => {
    const response = await api.put<{ success: boolean; data: SystemConfig }>(
      `${BASE_URL}/system/${id}`,
      data
    );
    return response.data;
  },

  // Price Configuration
  getPriceConfigs: async (params?: {
    vehicleTypeId?: number;
    locationId?: number;
    isActive?: boolean;
  }) => {
    const response = await api.get<{ success: boolean; data: PriceConfig[] }>(
      `${BASE_URL}/pricing`,
      { params }
    );
    return response.data;
  },

  getActivePriceConfig: async (params: { vehicleTypeId: number; locationId?: number }) => {
    const response = await api.get<{ success: boolean; data: PriceConfig }>(
      `${BASE_URL}/pricing/active`,
      { params }
    );
    return response.data;
  },

  createPriceConfig: async (data: CreatePriceConfigDto) => {
    const response = await api.post<{ success: boolean; data: PriceConfig }>(
      `${BASE_URL}/pricing`,
      data
    );
    return response.data;
  },

  updatePriceConfig: async (id: number, data: Partial<PriceConfig>) => {
    const response = await api.put<{ success: boolean; data: PriceConfig }>(
      `${BASE_URL}/pricing/${id}`,
      data
    );
    return response.data;
  },

  deactivatePriceConfig: async (id: number) => {
    const response = await api.post<{ success: boolean; data: PriceConfig }>(
      `${BASE_URL}/pricing/${id}/deactivate`
    );
    return response.data;
  },
};

export default configService;
