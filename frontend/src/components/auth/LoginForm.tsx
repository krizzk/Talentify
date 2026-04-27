'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { loginSchema, type LoginFormData } from '@/lib/schemas/auth.schemas';
import { useLogin } from '@/hooks/use-auth';
import { GoogleLoginButton } from './GoogleLoginButton';
import {
  getGoogleAuthAvailability,
  getGoogleClientId,
} from '@/lib/auth.utils';

export function LoginForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const { mutate: submitLogin } = useLogin();
  const clientId = getGoogleClientId();
  const currentOrigin =
    typeof window !== 'undefined' ? window.location.origin : undefined;
  const googleAuth = getGoogleAuthAvailability(currentOrigin);
  const showGoogleDivider = googleAuth.enabled && Boolean(clientId);

  const onSubmit = (data: LoginFormData) => {
    submitLogin(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <GoogleLoginButton />

        {!googleAuth.enabled && !clientId && (
          <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 backdrop-blur">
            <p className="text-xs leading-6 text-amber-700">
              Tombol Google akan muncul setelah setup Google OAuth credentials
            </p>
          </div>
        )}
      </div>

      {showGoogleDivider && (
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-slate-400 backdrop-blur">
              atau
            </span>
          </div>
        </div>
      )}

      <Input
        id="email"
        label="Email"
        type="email"
        placeholder="nama@email.com"
        error={errors.email?.message}
        disabled={isSubmitting}
        {...register('email')}
      />

      <Input
        id="password"
        label="Password"
        type="password"
        placeholder="••••••••"
        error={errors.password?.message}
        disabled={isSubmitting}
        {...register('password')}
      />

      <div className="flex items-center justify-between text-sm">
        <label className="flex cursor-pointer items-center gap-2 text-slate-600">
          <input
            type="checkbox"
            className="field-checkbox"
          />
          <span>Ingatkan saya</span>
        </label>
        <a
          href="#"
          className="font-semibold text-indigo-600 hover:text-indigo-700"
        >
          Lupa password?
        </a>
      </div>

      <Button type="submit" disabled={isSubmitting} isLoading={isSubmitting} className="w-full">
        {isSubmitting ? 'Sedang masuk...' : 'Masuk'}
      </Button>

      <div className="text-center">
        <p className="text-slate-600">
          Belum punya akun?{' '}
          <Link
            href="/auth/register"
            className="font-semibold text-indigo-600 hover:text-indigo-700"
          >
            Daftar di sini
          </Link>
        </p>
      </div>
    </form>
  );
}
