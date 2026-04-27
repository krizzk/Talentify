import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '@/lib/api';
import type {
  AdminDashboardData,
  AdminManagedUser,
  AdminUsersResponse,
  ModerationResponse,
  SystemHealthResponse,
} from '@/types';

const ADMIN_DASHBOARD_QUERY_KEY = 'admin-dashboard';
const ADMIN_USERS_QUERY_KEY = 'admin-users';
const ADMIN_MODERATION_QUERY_KEY = 'admin-moderation';
const ADMIN_SYSTEM_HEALTH_QUERY_KEY = 'admin-system-health';

interface UpdateAdminUserPayload {
  id: string;
  plan?: AdminManagedUser['plan'];
  role?: AdminManagedUser['role'];
}

export function useAdminDashboard() {
  return useQuery<AdminDashboardData>({
    queryKey: [ADMIN_DASHBOARD_QUERY_KEY],
    queryFn: async () => {
      const response = await api.get<{ data: AdminDashboardData }>('/admin/dashboard');
      return response.data.data;
    },
  });
}

export function useAdminUsers(search: string, page = 1, limit = 10) {
  return useQuery<AdminUsersResponse>({
    queryKey: [ADMIN_USERS_QUERY_KEY, search, page, limit],
    queryFn: async () => {
      const response = await api.get<{ data: AdminUsersResponse }>('/admin/users', {
        params: {
          search: search || undefined,
          page,
          limit,
        },
      });
      return response.data.data;
    },
  });
}

export function useUpdateAdminUser() {
  const queryClient = useQueryClient();

  return useMutation<AdminManagedUser, unknown, UpdateAdminUserPayload>({
    mutationFn: async ({ id, ...payload }) => {
      const response = await api.patch<{ data: AdminManagedUser }>(`/admin/users/${id}`, payload);
      return response.data.data;
    },
    onSuccess: () => {
      toast.success('User berhasil diperbarui');
      void queryClient.invalidateQueries({ queryKey: [ADMIN_USERS_QUERY_KEY] });
      void queryClient.invalidateQueries({ queryKey: [ADMIN_DASHBOARD_QUERY_KEY] });
    },
    onError: () => {
      toast.error('Gagal memperbarui user');
    },
  });
}

export function useContentModeration() {
  return useQuery<ModerationResponse>({
    queryKey: [ADMIN_MODERATION_QUERY_KEY],
    queryFn: async () => {
      const response = await api.get<{ data: ModerationResponse }>('/admin/content-moderation');
      return response.data.data;
    },
  });
}

export function useSystemHealth() {
  return useQuery<SystemHealthResponse>({
    queryKey: [ADMIN_SYSTEM_HEALTH_QUERY_KEY],
    queryFn: async () => {
      const response = await api.get<{ data: SystemHealthResponse }>('/admin/system-health');
      return response.data.data;
    },
    refetchInterval: 30_000,
  });
}
