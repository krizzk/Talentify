import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { startTransition } from 'react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import type { LoginFormData, RegisterPayload } from '@/lib/schemas/auth.schemas';
import type { User } from '@/types';

interface AuthResponse {
  access_token: string;
  user: User;
}

export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const router = useRouter();

  return useMutation<AuthResponse, unknown, LoginFormData>({
    mutationFn: async (data) => {
      const response = await api.post<{ data: AuthResponse }>('/auth/login', data);
      return response.data.data;
    },
    onSuccess: (data) => {
      setAuth(data.user);
      toast.success(`Selamat datang, ${data.user.full_name}!`);
      startTransition(() => {
        router.replace('/dashboard');
        router.refresh();
      });
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: { message?: string } } } };
      const message = err?.response?.data?.error?.message ?? 'Login gagal. Cek email dan password Anda.';
      toast.error(message);
    },
  });
}

export function useRegister() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const router = useRouter();

  return useMutation<AuthResponse, unknown, RegisterPayload>({
    mutationFn: async (data) => {
      const response = await api.post<{ data: AuthResponse }>('/auth/register', data);
      return response.data.data;
    },
    onSuccess: (data) => {
      setAuth(data.user);
      toast.success(`Akun berhasil dibuat! Selamat datang, ${data.user.full_name}!`);
      startTransition(() => {
        router.replace('/dashboard');
        router.refresh();
      });
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: { message?: string } } } };
      const message = err?.response?.data?.error?.message ?? 'Pendaftaran gagal. Coba gunakan email lain.';
      toast.error(message);
    },
  });
}

export function useLogout() {
  const logout = useAuthStore((s) => s.logout);
  const router = useRouter();

  return useMutation<void, unknown, void>({
    mutationFn: async () => {
      await api.post('/auth/logout');
    },
    onSettled: () => {
      logout();
      startTransition(() => {
        router.replace('/auth/login');
        router.refresh();
      });
    },
  });
}
