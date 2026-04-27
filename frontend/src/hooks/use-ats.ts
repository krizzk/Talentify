import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';
import type { ATSAnalysisResult } from '@/types';

export function useAnalyzeATS(cvId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (jobDescription: string) => {
      const response = await api.post<{ data: ATSAnalysisResult }>('/ats/analyze', {
        cv_id: cvId,
        job_description: jobDescription,
      });
      return response.data.data;
    },
    onSuccess: (result, variables) => {
      qc.setQueryData(['ats', cvId], result);
      toast.success('Analisis ATS selesai!');
    },
    onError: (error: any) => {
      const code = error.response?.data?.error?.code;
      if (code === 'AI_TIMEOUT') {
        toast.error('Analisis memakan waktu terlalu lama. Silakan coba lagi.');
      } else {
        toast.error('Gagal menganalisis CV. Silakan coba lagi.');
      }
    },
  });
}

export function useGetATSResult(cvId: string) {
  return useQuery<ATSAnalysisResult>({
    queryKey: ['ats', cvId],
    queryFn: async () => {
      const response = await api.get<{ data: ATSAnalysisResult[] }>(
        `/ats/cv/${cvId}/history`
      );

      const latestResult = response.data.data[0];
      if (!latestResult) {
        throw new Error('Belum ada hasil ATS untuk CV ini');
      }

      return latestResult;
    },
    enabled: false, // Only fetch when explicitly triggered
  });
}
