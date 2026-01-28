import api from './api';
import { Customer, CustomerFormData, CustomerFilters, PaginatedResponse, ApiResponse } from '../types';

export const customerService = {
  async getAll(params: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
    filters?: CustomerFilters;
  }): Promise<PaginatedResponse<Customer>> {
    const { page = 1, limit = 25, sortBy = 'name', sortOrder = 'ASC', filters = {} } = params;

    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      sortBy,
      sortOrder
    });

    if (filters.customer_type) queryParams.append('customer_type', filters.customer_type);
    if (filters.is_active !== undefined) queryParams.append('is_active', filters.is_active.toString());
    if (filters.search) queryParams.append('search', filters.search);
    if (filters.city) queryParams.append('city', filters.city);

    const response = await api.get(`/customers?${queryParams}`);
    return response.data;
  },

  async getActive(): Promise<ApiResponse<Customer[]>> {
    const response = await api.get('/customers/active');
    return response.data;
  },

  async search(query: string, limit: number = 10): Promise<ApiResponse<Customer[]>> {
    const response = await api.get(`/customers/search?q=${encodeURIComponent(query)}&limit=${limit}`);
    return response.data;
  },

  async getById(id: number): Promise<ApiResponse<Customer>> {
    const response = await api.get(`/customers/${id}`);
    return response.data;
  },

  async getStatistics(): Promise<ApiResponse<{
    total: number;
    active: number;
    inactive: number;
    byType: {
      individual: number;
      corporate: number;
      government: number;
    };
  }>> {
    const response = await api.get('/customers/statistics');
    return response.data;
  },

  async create(data: CustomerFormData): Promise<ApiResponse<Customer>> {
    const response = await api.post('/customers', data);
    return response.data;
  },

  async update(id: number, data: Partial<CustomerFormData>): Promise<ApiResponse<Customer>> {
    const response = await api.put(`/customers/${id}`, data);
    return response.data;
  },

  async toggleActive(id: number): Promise<ApiResponse<Customer>> {
    const response = await api.patch(`/customers/${id}/toggle-active`);
    return response.data;
  },

  async updateCreditLimit(id: number, creditLimit: number): Promise<ApiResponse<Customer>> {
    const response = await api.patch(`/customers/${id}/credit-limit`, { credit_limit: creditLimit });
    return response.data;
  },

  async delete(id: number): Promise<ApiResponse<void>> {
    const response = await api.delete(`/customers/${id}`);
    return response.data;
  },

  async getRentals(customerId: number, page: number = 1, limit: number = 10): Promise<{
    success: boolean;
    data: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    summary: {
      totalSpent: number;
      totalRentals: number;
      activeRentals: number;
      completedRentals: number;
    };
  }> {
    const response = await api.get(`/customers/${customerId}/rentals?page=${page}&limit=${limit}`);
    return response.data;
  }
};

export default customerService;
