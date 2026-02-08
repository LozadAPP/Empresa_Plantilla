import api from './api';
import { DashboardData, DashboardKPIs, DashboardAlert, ApiResponse } from '../types';

export const dashboardService = {
  async getMain(filters?: {
    location_id?: number;
    start_date?: string;
    end_date?: string;
  }): Promise<ApiResponse<DashboardData>> {
    const queryParams = new URLSearchParams();
    if (filters?.location_id) queryParams.append('location_id', filters.location_id.toString());
    if (filters?.start_date) queryParams.append('start_date', filters.start_date);
    if (filters?.end_date) queryParams.append('end_date', filters.end_date);

    const params = queryParams.toString() ? `?${queryParams}` : '';
    const response = await api.get(`/dashboard${params}`);
    return response.data;
  },

  async getKPIs(locationId?: number): Promise<ApiResponse<DashboardKPIs>> {
    const params = locationId ? `?location_id=${locationId}` : '';
    const response = await api.get(`/dashboard/kpis${params}`);
    return response.data;
  },

  async getAlerts(locationId?: number): Promise<ApiResponse<DashboardAlert[]>> {
    const params = locationId ? `?location_id=${locationId}` : '';
    const response = await api.get(`/dashboard/alerts${params}`);
    return response.data;
  },

  async getVehiclesByLocation(): Promise<ApiResponse<{
    location: string;
    city: string;
    available: number;
    rented: number;
    maintenance: number;
    total: number;
  }[]>> {
    const response = await api.get('/dashboard/vehicles-by-location');
    return response.data;
  },

  async getOccupancyTrend(locationId?: number): Promise<ApiResponse<{
    date: string;
    occupancyRate: string;
    rented: number;
    available: number;
  }[]>> {
    const params = locationId ? `?location_id=${locationId}` : '';
    const response = await api.get(`/dashboard/occupancy-trend${params}`);
    return response.data;
  },

  async getTopCustomers(limit: number = 5): Promise<ApiResponse<{
    id: number;
    name: string;
    contactPerson: string;
    email: string;
    totalRevenue: number;
    totalRentals: number;
  }[]>> {
    const response = await api.get(`/dashboard/top-customers?limit=${limit}`);
    return response.data;
  },

  async getRecentRentals(limit: number = 5): Promise<ApiResponse<{
    id: number;
    customerName: string;
    customerContact: string;
    vehicleName: string;
    vehiclePlate: string;
    startDate: string;
    endDate: string;
    totalAmount: number;
    status: string;
    createdAt: string;
  }[]>> {
    const response = await api.get(`/dashboard/recent-rentals?limit=${limit}`);
    return response.data;
  },

  async getCriticalAlerts(): Promise<ApiResponse<DashboardAlert[]>> {
    const response = await api.get('/dashboard/critical-alerts');
    return response.data;
  },

  async getPerformanceData(period: 'day' | 'week' | 'month' | 'year' = 'month'): Promise<ApiResponse<{
    timeBucket: string;
    revenue: number;
    occupancy: number;
  }[]>> {
    const response = await api.get(`/dashboard/performance-data?period=${period}`);
    return response.data;
  },

  async getMaintenanceSchedule(): Promise<ApiResponse<{
    overdue: {
      id: number;
      vehicleName: string;
      licensePlate: string;
      scheduledDate: string;
      daysOverdue: number;
    }[];
    upcoming: {
      id: number;
      vehicleName: string;
      licensePlate: string;
      scheduledDate: string;
      daysUntil: number;
    }[];
  }>> {
    const response = await api.get('/dashboard/maintenance-schedule');
    return response.data;
  }
};

export default dashboardService;
