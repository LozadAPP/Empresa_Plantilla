import api from './api';
import { Vehicle, VehicleFormData, VehicleFilters, PaginatedResponse, ApiResponse } from '../types';

export const vehicleService = {
  async getAll(params: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
    filters?: VehicleFilters;
  }): Promise<PaginatedResponse<Vehicle>> {
    const { page = 1, limit = 25, sortBy = 'created_at', sortOrder = 'DESC', filters = {} } = params;

    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      sortBy,
      sortOrder
    });

    if (filters.status) queryParams.append('status', filters.status);
    if (filters.location_id) queryParams.append('location_id', filters.location_id.toString());
    if (filters.vehicle_type_id) queryParams.append('vehicle_type_id', filters.vehicle_type_id.toString());
    if (filters.condition) queryParams.append('condition', filters.condition);
    if (filters.search) queryParams.append('search', filters.search);

    const response = await api.get(`/vehicles?${queryParams}`);
    return response.data;
  },

  async getAvailable(locationId?: number): Promise<ApiResponse<Vehicle[]>> {
    const params = locationId ? `?location_id=${locationId}` : '';
    const response = await api.get(`/vehicles/available${params}`);
    return response.data;
  },

  async getById(id: number): Promise<ApiResponse<Vehicle>> {
    const response = await api.get(`/vehicles/${id}`);
    return response.data;
  },

  async getStatistics(locationId?: number): Promise<ApiResponse<{
    available: number;
    rented: number;
    maintenance: number;
    total: number;
    occupancyRate: number;
  }>> {
    const params = locationId ? `?location_id=${locationId}` : '';
    const response = await api.get(`/vehicles/statistics${params}`);
    return response.data;
  },

  async getByType(): Promise<ApiResponse<{ id: number; name: string; total: number; available: number; rented: number; maintenance: number }[]>> {
    const response = await api.get('/vehicles/by-type');
    return response.data;
  },

  async getVehicleTypes(): Promise<ApiResponse<{ id: number; name: string; description?: string; daily_rate: number }[]>> {
    const response = await api.get('/vehicles/types');
    return response.data;
  },

  async create(data: VehicleFormData): Promise<ApiResponse<Vehicle>> {
    const response = await api.post('/vehicles', data);
    return response.data;
  },

  async update(id: number, data: Partial<VehicleFormData>): Promise<ApiResponse<Vehicle>> {
    const response = await api.put(`/vehicles/${id}`, data);
    return response.data;
  },

  async updateStatus(id: number, status: 'available' | 'rented' | 'maintenance'): Promise<ApiResponse<Vehicle>> {
    const response = await api.patch(`/vehicles/${id}/status`, { status });
    return response.data;
  },

  async delete(id: number): Promise<ApiResponse<void>> {
    const response = await api.delete(`/vehicles/${id}`);
    return response.data;
  },

  async downloadFicha(id: number): Promise<Blob> {
    const response = await api.get(`/vehicles/${id}/ficha-pdf`, { responseType: 'blob' });
    return response.data;
  }
};

export default vehicleService;
