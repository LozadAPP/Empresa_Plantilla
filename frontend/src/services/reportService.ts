import api from './api';
import {
  IncomeReport,
  OccupancyReport,
  ProfitabilityReport,
  TopCustomer,
  VehiclePerformance,
  DashboardSummary,
  ReportFilters,
} from '../types/reports';

const BASE_URL = '/reports';

export const reportService = {
  getIncomeReport: async (filters?: ReportFilters) => {
    const response = await api.get<{ success: boolean; data: IncomeReport }>(
      `${BASE_URL}/income`,
      { params: filters }
    );
    return response.data;
  },

  getOccupancyReport: async (filters?: ReportFilters) => {
    const response = await api.get<{ success: boolean; data: OccupancyReport }>(
      `${BASE_URL}/occupancy`,
      { params: filters }
    );
    return response.data;
  },

  getProfitabilityReport: async (filters?: ReportFilters) => {
    const response = await api.get<{ success: boolean; data: ProfitabilityReport }>(
      `${BASE_URL}/profitability`,
      { params: filters }
    );
    return response.data;
  },

  getTopCustomers: async (filters?: ReportFilters) => {
    const response = await api.get<{ success: boolean; data: TopCustomer[] }>(
      `${BASE_URL}/top-customers`,
      { params: filters }
    );
    return response.data;
  },

  getVehiclePerformance: async (filters?: ReportFilters) => {
    const response = await api.get<{ success: boolean; data: VehiclePerformance[] }>(
      `${BASE_URL}/vehicle-performance`,
      { params: filters }
    );
    return response.data;
  },

  getDashboardSummary: async (params?: { locationId?: number }) => {
    const response = await api.get<{ success: boolean; data: DashboardSummary }>(
      `${BASE_URL}/dashboard-summary`,
      { params }
    );
    return response.data;
  },
};

export default reportService;
