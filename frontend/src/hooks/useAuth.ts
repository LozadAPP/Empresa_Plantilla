import { useSelector, useDispatch } from 'react-redux';
import { useCallback } from 'react';
import { RootState, AppDispatch } from '../store';
import { login, logout, clearError } from '../store/slices/authSlice';
import { LoginCredentials } from '../types';

export const useAuth = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user, isAuthenticated, loading, error } = useSelector(
    (state: RootState) => state.auth
  );

  const handleLogin = useCallback(async (credentials: LoginCredentials) => {
    return dispatch(login(credentials));
  }, [dispatch]);

  const handleLogout = useCallback(async () => {
    return dispatch(logout());
  }, [dispatch]);

  const handleClearError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  const hasRole = useCallback((role: string): boolean => {
    if (!user?.roles) return false;
    return user.roles.includes(role) || user.roles.includes('admin');
  }, [user?.roles]);

  const hasAnyRole = useCallback((...roles: string[]): boolean => {
    if (!user?.roles) return false;
    if (user.roles.includes('admin')) return true;
    return roles.some((role) => user.roles.includes(role));
  }, [user?.roles]);

  return {
    user,
    isAuthenticated,
    loading,
    error,
    login: handleLogin,
    logout: handleLogout,
    clearError: handleClearError,
    hasRole,
    hasAnyRole
  };
};

export default useAuth;
