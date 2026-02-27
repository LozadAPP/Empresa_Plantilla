import api from './api';
import { Expense, ExpenseFilters, ExpenseSummary, ExpenseCategoryConfig } from '../types/expense';

interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface SingleResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export const expenseService = {
  async getAll(filters?: ExpenseFilters): Promise<PaginatedResponse<Expense>> {
    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.start_date) params.append('start_date', filters.start_date);
    if (filters?.end_date) params.append('end_date', filters.end_date);
    if (filters?.location_id) params.append('location_id', filters.location_id.toString());
    if (filters?.search) params.append('search', filters.search);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const query = params.toString() ? `?${params}` : '';
    const response = await api.get(`/expenses${query}`);
    return response.data;
  },

  async getById(id: number): Promise<SingleResponse<Expense>> {
    const response = await api.get(`/expenses/${id}`);
    return response.data;
  },

  async create(data: Partial<Expense>): Promise<SingleResponse<Expense>> {
    const response = await api.post('/expenses', data);
    return response.data;
  },

  async update(id: number, data: Partial<Expense>): Promise<SingleResponse<Expense>> {
    const response = await api.put(`/expenses/${id}`, data);
    return response.data;
  },

  async delete(id: number): Promise<SingleResponse<null>> {
    const response = await api.delete(`/expenses/${id}`);
    return response.data;
  },

  async approve(id: number): Promise<SingleResponse<Expense>> {
    const response = await api.patch(`/expenses/${id}/approve`);
    return response.data;
  },

  async reject(id: number, rejection_reason: string): Promise<SingleResponse<Expense>> {
    const response = await api.patch(`/expenses/${id}/reject`, { rejection_reason });
    return response.data;
  },

  async getSummary(): Promise<SingleResponse<ExpenseSummary>> {
    const response = await api.get('/expenses/summary');
    return response.data;
  },

  async getCategories(): Promise<SingleResponse<ExpenseCategoryConfig[]>> {
    const response = await api.get('/expenses/categories');
    return response.data;
  },
};

export default expenseService;
