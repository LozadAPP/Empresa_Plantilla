import api from './api';
import type { Supplier, SupplierFilters, SupplierDropdown, SupplierStats } from '../types/supplier';

const BASE_URL = '/suppliers';

export const supplierService = {
  getAll: async (params?: SupplierFilters) => {
    const response = await api.get<{
      success: boolean;
      data: Supplier[];
      pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      };
    }>(BASE_URL, { params });
    return response.data;
  },

  getById: async (id: number) => {
    const response = await api.get<{ success: boolean; data: Supplier }>(
      `${BASE_URL}/${id}`
    );
    return response.data;
  },

  create: async (data: Partial<Supplier>) => {
    const response = await api.post<{ success: boolean; data: Supplier; message: string }>(
      BASE_URL,
      data
    );
    return response.data;
  },

  update: async (id: number, data: Partial<Supplier>) => {
    const response = await api.put<{ success: boolean; data: Supplier; message: string }>(
      `${BASE_URL}/${id}`,
      data
    );
    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.delete<{ success: boolean; message: string }>(
      `${BASE_URL}/${id}`
    );
    return response.data;
  },

  toggleActive: async (id: number) => {
    const response = await api.patch<{
      success: boolean;
      message: string;
      data: { id: number; isActive: boolean };
    }>(`${BASE_URL}/${id}/toggle`);
    return response.data;
  },

  getDropdown: async () => {
    const response = await api.get<{ success: boolean; data: SupplierDropdown[] }>(
      `${BASE_URL}/dropdown`
    );
    return response.data;
  },

  getStats: async () => {
    const response = await api.get<{ success: boolean; data: SupplierStats }>(
      `${BASE_URL}/stats`
    );
    return response.data;
  },
};

export default supplierService;
