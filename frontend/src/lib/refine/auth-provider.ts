import type { AuthProvider } from '@refinedev/core';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import type { AuthResponse, User } from '@/types';

async function syncIdentity() {
  const response = await api.get<{ data: User }>('/users/me');
  const user = response.data.data;
  useAuthStore.getState().setUser(user);
  return user;
}

export const authProvider: AuthProvider = {
  login: async (params) => {
    const response = await api.post<{ data: AuthResponse }>('/auth/login', params);
    const user = response.data.data.user;

    useAuthStore.getState().setAuth(user);

    return {
      success: true,
      redirectTo: '/dashboard',
    };
  },
  register: async (params) => {
    const response = await api.post<{ data: AuthResponse }>('/auth/register', params);
    const user = response.data.data.user;

    useAuthStore.getState().setAuth(user);

    return {
      success: true,
      redirectTo: '/dashboard',
    };
  },
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Keep local logout behavior even if the backend session is already gone.
    }

    useAuthStore.getState().logout();

    return {
      success: true,
      redirectTo: '/auth/login',
    };
  },
  check: async () => {
    const currentUser = useAuthStore.getState().user;

    if (currentUser) {
      return {
        authenticated: true,
      };
    }

    try {
      await syncIdentity();

      return {
        authenticated: true,
      };
    } catch (error) {
      return {
        authenticated: false,
        logout: true,
        redirectTo: '/auth/login',
        error: error as Error,
      };
    }
  },
  onError: async (error) => {
    const statusCode =
      (error as { statusCode?: number })?.statusCode ??
      (error as { response?: { status?: number } })?.response?.status;

    if (statusCode === 401) {
      useAuthStore.getState().logout();

      return {
        logout: true,
        redirectTo: '/auth/login',
        error,
      };
    }

    return {
      error,
    };
  },
  getIdentity: async () => {
    const currentUser = useAuthStore.getState().user;

    if (currentUser) {
      return currentUser;
    }

    try {
      return await syncIdentity();
    } catch {
      return null;
    }
  },
  getPermissions: async () => {
    return useAuthStore.getState().user?.role ?? null;
  },
};
