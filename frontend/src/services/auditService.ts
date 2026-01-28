import api from './api';

// Types
export interface AuditLogEntry {
  id: number;
  userId: number;
  userName: string;
  action: string;
  entityType: string;
  entityId?: number;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: string;
}

export interface AuditStats {
  total: number;
  today: number;
  thisWeek: number;
  byAction: {
    create: number;
    update: number;
    delete: number;
  };
}

export interface AuditFilters {
  search?: string;
  action?: string;
  entityType?: string;
  userId?: number;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

const BASE_URL = '/audit';

export const auditService = {
  // Get all audit logs with filters and pagination
  getAuditLogs: async (params?: AuditFilters) => {
    const response = await api.get<{
      success: boolean;
      data: AuditLogEntry[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>(BASE_URL, { params });
    return response.data;
  },

  // Get audit log by ID
  getAuditLogById: async (id: number) => {
    const response = await api.get<{ success: boolean; data: AuditLogEntry }>(
      `${BASE_URL}/${id}`
    );
    return response.data;
  },

  // Get audit statistics
  getAuditStats: async () => {
    const response = await api.get<{ success: boolean; data: AuditStats }>(
      `${BASE_URL}/stats`
    );
    return response.data;
  },

  // Get audit logs by user
  getAuditLogsByUser: async (userId: number, params?: { page?: number; limit?: number }) => {
    const response = await api.get<{
      success: boolean;
      data: AuditLogEntry[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>(`${BASE_URL}/user/${userId}`, { params });
    return response.data;
  },

  // Get entity types (for filter dropdown)
  getEntityTypes: async () => {
    const response = await api.get<{ success: boolean; data: string[] }>(
      `${BASE_URL}/entity-types`
    );
    return response.data;
  },
};

export default auditService;
