import api from './api';
import { LoginCredentials, LoginResponse, User } from '../types';

/**
 * Authentication service using HTTP-only cookies
 * Tokens are managed by the browser automatically via cookies
 * Only user data is stored in localStorage for UI purposes
 */
export const authService = {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/auth/login', credentials);

    if (response.data.success && response.data.data) {
      // Only store user data locally (tokens are in HTTP-only cookies)
      const { user } = response.data.data;
      localStorage.setItem('user', JSON.stringify(user));
    }

    return response.data;
  },

  async logout(): Promise<void> {
    try {
      // Server will clear HTTP-only cookies
      await api.post('/auth/logout');
    } finally {
      // Clear local user data
      localStorage.removeItem('user');
    }
  },

  async getMe(): Promise<User> {
    const response = await api.get('/auth/me');
    // Update stored user data
    if (response.data.data) {
      localStorage.setItem('user', JSON.stringify(response.data.data));
    }
    return response.data.data;
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    const response = await api.post('/auth/change-password', {
      currentPassword,
      newPassword
    });
    return response.data;
  },

  async forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  async verifyResetToken(token: string): Promise<{ success: boolean; message: string; userId?: number }> {
    const response = await api.post('/auth/verify-reset-token', { token });
    return response.data;
  },

  async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    const response = await api.post('/auth/reset-password', {
      token,
      newPassword
    });
    return response.data;
  },

  getStoredUser(): User | null {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
    return null;
  },

  /**
   * Check if user is authenticated by verifying with the server
   * Since tokens are in HTTP-only cookies, we can't check them directly
   */
  async checkAuth(): Promise<boolean> {
    try {
      await this.getMe();
      return true;
    } catch {
      localStorage.removeItem('user');
      return false;
    }
  },

  /**
   * Quick check for stored user (doesn't verify with server)
   * Use checkAuth() for a verified check
   */
  hasStoredUser(): boolean {
    return !!this.getStoredUser();
  }
};

export default authService;
