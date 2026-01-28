import api from './api';
import {
  Account,
  Transaction,
  CreateTransactionDto,
  BalanceSheet,
  IncomeStatement,
} from '../types/accounting';

const BASE_URL = '/accounting';

export const accountingService = {
  // Accounts
  getAccounts: async (params?: { accountType?: string; isActive?: boolean }) => {
    const response = await api.get<{ success: boolean; data: Account[] }>(`${BASE_URL}/accounts`, {
      params,
    });
    return response.data;
  },

  createAccount: async (data: Partial<Account>) => {
    const response = await api.post<{ success: boolean; data: Account }>(
      `${BASE_URL}/accounts`,
      data
    );
    return response.data;
  },

  updateAccount: async (id: number, data: Partial<Account>) => {
    const response = await api.put<{ success: boolean; data: Account }>(
      `${BASE_URL}/accounts/${id}`,
      data
    );
    return response.data;
  },

  // Transactions
  getTransactions: async (params?: {
    transactionType?: string;
    status?: string;
    accountId?: number;
    locationId?: number;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) => {
    const response = await api.get<{
      success: boolean;
      data: Transaction[];
      pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      };
    }>(`${BASE_URL}/transactions`, { params });
    return response.data;
  },

  createTransaction: async (data: CreateTransactionDto) => {
    const response = await api.post<{ success: boolean; data: Transaction }>(
      `${BASE_URL}/transactions`,
      data
    );
    return response.data;
  },

  approveTransaction: async (id: number) => {
    const response = await api.post<{ success: boolean; data: Transaction }>(
      `${BASE_URL}/transactions/${id}/approve`
    );
    return response.data;
  },

  cancelTransaction: async (id: number, reason: string) => {
    const response = await api.post<{ success: boolean; data: Transaction }>(
      `${BASE_URL}/transactions/${id}/cancel`,
      { reason }
    );
    return response.data;
  },

  // Reports
  getBalanceSheet: async () => {
    const response = await api.get<{ success: boolean; data: BalanceSheet }>(
      `${BASE_URL}/reports/balance-sheet`
    );
    return response.data;
  },

  getIncomeStatement: async (params?: { startDate?: string; endDate?: string }) => {
    const response = await api.get<{ success: boolean; data: IncomeStatement }>(
      `${BASE_URL}/reports/income-statement`,
      { params }
    );
    return response.data;
  },
};

export default accountingService;
