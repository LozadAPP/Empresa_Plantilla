import api from './api';

// Types
export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  location_id?: number;
  is_active: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
  roles: Role[];
  location?: {
    id: number;
    name: string;
    city: string;
  };
}

export interface Role {
  id: number;
  name: string;
  description?: string;
  permissions: string[];
}

export interface CreateUserDto {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
  location_id?: number;
  roles: string[];
}

export interface UpdateUserDto {
  email?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  location_id?: number;
  roles?: string[];
}

export interface UserStats {
  total: number;
  active: number;
  inactive: number;
  byRole: {
    role: string;
    count: number;
  }[];
}

export interface UserFilters {
  search?: string;
  role?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

const BASE_URL = '/users';

export const userService = {
  // Get all users with filters and pagination
  getUsers: async (params?: UserFilters) => {
    const response = await api.get<{
      success: boolean;
      data: User[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>(BASE_URL, { params });
    return response.data;
  },

  // Get user by ID
  getUserById: async (id: number) => {
    const response = await api.get<{ success: boolean; data: User }>(
      `${BASE_URL}/${id}`
    );
    return response.data;
  },

  // Create new user
  createUser: async (data: CreateUserDto) => {
    const response = await api.post<{ success: boolean; data: User; message: string }>(
      BASE_URL,
      data
    );
    return response.data;
  },

  // Update user
  updateUser: async (id: number, data: UpdateUserDto) => {
    const response = await api.put<{ success: boolean; data: User; message: string }>(
      `${BASE_URL}/${id}`,
      data
    );
    return response.data;
  },

  // Toggle user status (activate/deactivate)
  toggleUserStatus: async (id: number) => {
    const response = await api.post<{
      success: boolean;
      message: string;
      data: { id: number; is_active: boolean };
    }>(`${BASE_URL}/${id}/toggle`);
    return response.data;
  },

  // Reset user password
  resetUserPassword: async (id: number, newPassword: string) => {
    const response = await api.post<{ success: boolean; message: string }>(
      `${BASE_URL}/${id}/reset-password`,
      { newPassword }
    );
    return response.data;
  },

  // Get user statistics
  getUserStats: async () => {
    const response = await api.get<{ success: boolean; data: UserStats }>(
      `${BASE_URL}/stats`
    );
    return response.data;
  },

  // Get all roles (for dropdown)
  getRoles: async () => {
    const response = await api.get<{ success: boolean; data: Role[] }>(
      `${BASE_URL}/roles`
    );
    return response.data;
  },
};

export default userService;
