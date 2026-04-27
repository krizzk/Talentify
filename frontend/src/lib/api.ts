import axios, { AxiosInstance } from 'axios';
import { useAuthStore } from '@/store/auth.store';
import { toast } from 'sonner';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window === 'undefined' ? 'http://localhost:4000/api' : '/api');

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response Interceptor: Handle 401, refresh token, etc.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh token
        await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        const authStore = useAuthStore.getState();
        authStore.logout();
        window.location.href = '/auth/login';
        return Promise.reject(refreshError);
      }
    }

    // Handle 429 Rate Limit
    if (error.response?.status === 429) {
      toast.error('Terlalu banyak request. Silakan coba lagi nanti.');
    }

    // Handle 503 Service Unavailable (AI timeout)
    if (error.response?.status === 503) {
      const code = error.response?.data?.error?.code;
      if (code === 'AI_TIMEOUT') {
        toast.error('Proses AI memakan waktu terlalu lama. Silakan coba lagi.');
      } else {
        toast.error('Server sedang maintenance. Silakan coba lagi nanti.');
      }
    }

    return Promise.reject(error);
  }
);

export default api;
