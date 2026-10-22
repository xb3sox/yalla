import { useState, useEffect, useCallback } from 'react';
import { apiClient, api } from '../services/api';

interface User {
  id: string;
  phone: string;
  display_name: string;
  language: string;
  role: string;
  preferences?: {
    preferred_area?: string;
    experience_language?: string;
    budget_min?: number;
    budget_max?: number;
  };
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: apiClient.isAuthenticated(),
    isLoading: false,
    error: null,
  });

  const login = useCallback(async (phone: string, password: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await api.auth.login({ phone, password }) as any;
      
      if (response.success && response.data) {
        apiClient.setTokens(response.data.tokens.accessToken); // refresh token stays in HttpOnly cookie
        
        // Fetch user data
        const userResponse = await api.auth.me() as any;
        if (userResponse.success && userResponse.data) {
          setState({
            user: userResponse.data.user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
          return true;
        }
      }
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: response.error?.message || 'Login failed',
      }));
      return false;
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Login failed',
      }));
      return false;
    }
  }, []);

  const register = useCallback(async (data: {
    phone: string;
    password: string;
    display_name: string;
    language?: string;
    adult_declaration_accepted: boolean;
    terms_accepted: boolean;
  }) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await api.auth.register(data) as any;
      
      if (response.success && response.data) {
        apiClient.setTokens(response.data.tokens.accessToken); // refresh token stays in HttpOnly cookie
        
        // Fetch user data
        const userResponse = await api.auth.me() as any;
        if (userResponse.success && userResponse.data) {
          setState({
            user: userResponse.data.user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
          return true;
        }
      }
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: response.error?.message || 'Registration failed',
      }));
      return false;
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Registration failed',
      }));
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.auth.logout();
    } catch (error) {
      // Ignore logout errors
    } finally {
      apiClient.clearTokens();
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  }, []);

  const updateUser = useCallback(async (data: Partial<User>) => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const response = await api.auth.updatePreferences(data) as any;
      
      if (response.success && response.data) {
        setState(prev => ({
          ...prev,
          user: response.data.user,
          isLoading: false,
        }));
        return true;
      }
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: response.error?.message || 'Update failed',
      }));
      return false;
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Update failed',
      }));
      return false;
    }
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Check if user is authenticated on mount
  useEffect(() => {
    if (apiClient.isAuthenticated()) {
      const fetchUser = async () => {
        try {
          const response = await api.auth.me() as any;
          if (response.success && response.data) {
            setState({
              user: response.data.user,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
          } else {
            apiClient.clearTokens();
            setState({
              user: null,
              isAuthenticated: false,
              isLoading: false,
              error: null,
            });
          }
        } catch (error) {
          apiClient.clearTokens();
          setState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      };
      
      fetchUser();
    }
  }, []);

  return {
    ...state,
    login,
    register,
    logout,
    updateUser,
    clearError,
  };
}
