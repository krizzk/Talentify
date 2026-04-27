import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '@/lib/api';
import type { CV } from '@/types';

const CV_QUERY_KEY = 'cvs';

interface ApiError {
  code?: string;
  message?: string;
}

export function useCVList() {
  return useQuery<CV[], unknown>({
    queryKey: [CV_QUERY_KEY],
    queryFn: async () => {
      const response = await api.get<{ data: CV[] }>('/cv');
      return response.data.data;
    },
    staleTime: 2 * 60 * 1000,
  });
}

export function useGetCV(id: string) {
  return useQuery<CV, unknown>({
    queryKey: [CV_QUERY_KEY, id],
    queryFn: async () => {
      const response = await api.get<{ data: CV }>(`/cv/${id}`);
      return response.data.data;
    },
  });
}

export function useDeleteCV() {
  const qc = useQueryClient();

  return useMutation<void, unknown, string>({
    mutationFn: async (cvId) => {
      await api.delete(`/cv/${cvId}`);
    },
    onSuccess: (_, cvId) => {
      qc.setQueryData<CV[]>([CV_QUERY_KEY], (old) => old?.filter((cv) => cv.id !== cvId) ?? []);
      toast.success('CV berhasil dihapus');
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: ApiError } } };
      const message = err?.response?.data?.error?.message ?? 'Gagal menghapus CV';
      toast.error(message);
    },
  });
}

export function useGenerateCV() {
  const qc = useQueryClient();

  return useMutation<CV, unknown, void>({
    mutationFn: async () => {
      const response = await api.post<{ data: CV }>('/cv/generate');
      return response.data.data;
    },
    onSuccess: (cv) => {
      qc.setQueryData<CV[]>([CV_QUERY_KEY], (old) => [cv, ...(old ?? [])]);
      toast.success('CV berhasil di-generate!');
      if (typeof window !== 'undefined') {
        window.location.href = cv.public_url ?? `/cv/${cv.id}`;
      }
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: ApiError } } };
      const apiError = err?.response?.data?.error;
      const code = apiError?.code;
      const message = apiError?.message;

      if (code === 'NOT_FOUND') {
        toast.error('Lengkapi profil kamu terlebih dahulu.');
        if (typeof window !== 'undefined') {
          window.location.href = '/profile';
        }
      } else if (code === 'FORBIDDEN') {
        toast.error('Limit harian tercapai. Upgrade ke Premium untuk akses unlimited.');
      } else {
        toast.error(message ?? 'Gagal generate CV. Coba lagi.');
      }
    },
  });
}

export function useTailorCV(cvId: string) {
  const qc = useQueryClient();

  return useMutation<CV, unknown, string>({
    mutationFn: async (jobDescription: string) => {
      const response = await api.post<{ data: CV }>(`/cv/${cvId}/tailor`, {
        job_description: jobDescription,
      });
      return response.data.data;
    },
    onSuccess: (tailoredCV) => {
      qc.setQueryData<CV[]>([CV_QUERY_KEY], (old) => [tailoredCV, ...(old ?? [])]);
      toast.success('CV berhasil disesuaikan!');
      if (typeof window !== 'undefined') {
        window.location.href = `/cv/${tailoredCV.id}`;
      }
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: ApiError } } };
      const message = err?.response?.data?.error?.message ?? 'Gagal menyesuaikan CV';
      toast.error(message);
    },
  });
}
