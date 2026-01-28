import api from './api';
import {
  MaintenanceType,
  MaintenanceOrder,
  CreateMaintenanceOrderDto,
  UpdateMaintenanceOrderDto,
} from '../types/maintenance';

const BASE_URL = '/maintenance';

export const maintenanceService = {
  // Maintenance Types
  getMaintenanceTypes: async (params?: { isActive?: boolean }) => {
    const response = await api.get<{ success: boolean; data: MaintenanceType[] }>(
      `${BASE_URL}/types`,
      { params }
    );
    return response.data;
  },

  createMaintenanceType: async (data: Partial<MaintenanceType>) => {
    const response = await api.post<{ success: boolean; data: MaintenanceType }>(
      `${BASE_URL}/types`,
      data
    );
    return response.data;
  },

  updateMaintenanceType: async (id: number, data: Partial<MaintenanceType>) => {
    const response = await api.put<{ success: boolean; data: MaintenanceType }>(
      `${BASE_URL}/types/${id}`,
      data
    );
    return response.data;
  },

  // Maintenance Orders
  getMaintenanceOrders: async (params?: {
    status?: string;
    priority?: string;
    vehicleId?: number;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) => {
    const response = await api.get<{
      success: boolean;
      data: MaintenanceOrder[];
      pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      };
    }>(`${BASE_URL}/orders`, { params });
    return response.data;
  },

  getMaintenanceOrderById: async (id: number) => {
    const response = await api.get<{ success: boolean; data: MaintenanceOrder }>(
      `${BASE_URL}/orders/${id}`
    );
    return response.data;
  },

  createMaintenanceOrder: async (data: CreateMaintenanceOrderDto) => {
    const response = await api.post<{ success: boolean; data: MaintenanceOrder }>(
      `${BASE_URL}/orders`,
      data
    );
    return response.data;
  },

  updateMaintenanceOrder: async (id: number, data: UpdateMaintenanceOrderDto) => {
    const response = await api.put<{ success: boolean; data: MaintenanceOrder }>(
      `${BASE_URL}/orders/${id}`,
      data
    );
    return response.data;
  },

  completeMaintenanceOrder: async (
    id: number,
    data: {
      actualCost?: number;
      actualDuration?: number;
      notes?: string;
      partsReplaced?: any[];
      mileageAtService?: number;
      nextServiceMileage?: number;
    }
  ) => {
    const response = await api.post<{ success: boolean; data: MaintenanceOrder }>(
      `${BASE_URL}/orders/${id}/complete`,
      data
    );
    return response.data;
  },

  getMaintenanceHistory: async (vehicleId: number) => {
    const response = await api.get<{ success: boolean; data: MaintenanceOrder[] }>(
      `${BASE_URL}/history/${vehicleId}`
    );
    return response.data;
  },
};

export default maintenanceService;
