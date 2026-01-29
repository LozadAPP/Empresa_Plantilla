import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api/v1';

// Debug: ver qué valor tiene la variable (eliminar después)
console.log('[API Config] VITE_API_URL:', import.meta.env.VITE_API_URL);
console.log('[API Config] API_URL final:', API_URL);

/**
 * Axios instance configured for HTTP-only cookie authentication
 * Tokens are automatically sent via cookies, not localStorage
 */
const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 30000,
  withCredentials: true  // Required for HTTP-only cookies
});

// Request interceptor - no token handling needed (cookies are automatic)
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Lista de rutas de autenticación que NO deben triggear refresh/redirect
    // Esto permite que los errores de login lleguen al componente para mostrar mensajes
    const authRoutes = ['/auth/login', '/auth/logout', '/auth/refresh', '/auth/forgot-password', '/auth/reset-password'];
    const isAuthRoute = authRoutes.some(route => originalRequest?.url?.includes(route));

    // Handle 401 - Unauthorized
    // NO intentar refresh si es una ruta de auth (para que el error llegue al componente)
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRoute) {
      originalRequest._retry = true;

      try {
        // Try to refresh token (refresh token is in HTTP-only cookie)
        await axios.post(`${API_URL}/auth/refresh`, {}, {
          withCredentials: true
        });

        // Retry original request (new tokens are in cookies)
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed - clear user data and redirect to login
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
