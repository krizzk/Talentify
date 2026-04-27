'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { registerSchema, type RegisterFormData } from '@/lib/schemas/auth.schemas';
import { useRegister } from '@/hooks/use-auth';

export function RegisterForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const { mutate: submitRegister } = useRegister();
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  const onSubmit = (data: RegisterFormData) => {
    const { confirm_password: _confirmPassword, ...payload } = data;
    submitRegister(payload);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-600 backdrop-blur">
          Registrasi dengan Google akan tersedia segera
        </div>
      </div>

      {clientId && (
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
        id="full_name"
        label="Nama Lengkap"
        type="text"
        placeholder="Contoh: Budi Santoso"
        error={errors.full_name?.message}
        disabled={isSubmitting}
        {...register('full_name')}
      />

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
        placeholder="Min 8 karakter, ada huruf dan angka"
        error={errors.password?.message}
        disabled={isSubmitting}
        {...register('password')}
      />

      <Input
        id="confirm_password"
        label="Konfirmasi Password"
        type="password"
        placeholder="Ulang password"
        error={errors.confirm_password?.message}
        disabled={isSubmitting}
        {...register('confirm_password')}
      />

      <label className="flex cursor-pointer items-start gap-2">
        <input
          type="checkbox"
          className="field-checkbox mt-0.5"
          required
        />
        <span className="text-sm leading-7 text-slate-600">
          Saya setuju dengan{' '}
          <a href="#" className="font-semibold text-indigo-600 hover:text-indigo-700">
            Syarat & Ketentuan
          </a>{' '}
          dan{' '}
          <a href="#" className="font-semibold text-indigo-600 hover:text-indigo-700">
            Kebijakan Privasi
          </a>
        </span>
      </label>

      <Button type="submit" disabled={isSubmitting} isLoading={isSubmitting} className="w-full">
        {isSubmitting ? 'Membuat akun...' : 'Daftar'}
      </Button>

      <div className="text-center">
        <p className="text-slate-600">
          Sudah punya akun?{' '}
          <Link
            href="/auth/login"
            className="font-semibold text-indigo-600 hover:text-indigo-700"
          >
            Masuk di sini
          </Link>
        </p>
      </div>
    </form>
  );
}
