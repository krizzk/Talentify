import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { profileSchema, type ProfileFormData } from '@/lib/schemas/profile.schemas';
import { toast } from 'sonner';
import type { Profile } from '@/types';

const PROFILE_QUERY_KEY = ['profile'];

export function useProfile() {
  return useQuery<Profile>({
    queryKey: PROFILE_QUERY_KEY,
    queryFn: async () => {
      const response = await api.get<{ data: Profile }>('/profile');
      return response.data.data;
    },
    retry: (failureCount, error: any) => {
      // Don't retry if 404 (profile not created yet)
      return error.response?.status !== 404 && failureCount < 1;
    },
  });
}

export function useUpsertProfile() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (data: ProfileFormData) => {
      const response = await api.put<{ data: Profile }>('/profile', data);
      return response.data.data;
    },
    onSuccess: (profile) => {
      qc.setQueryData<Profile>(PROFILE_QUERY_KEY, profile);
      toast.success('Profil berhasil disimpan!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.error?.message ?? 'Gagal menyimpan profil';
      toast.error(message);
    },
  });
}
