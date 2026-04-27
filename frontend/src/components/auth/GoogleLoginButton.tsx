'use client';

import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { useRouter } from 'next/navigation';
import { startTransition } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { toast } from 'sonner';
import {
  getGoogleAllowedOrigins,
  getGoogleAuthAvailability,
} from '@/lib/auth.utils';

export function GoogleLoginButton() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const currentOrigin =
    typeof window !== 'undefined' ? window.location.origin : undefined;
  const googleAuth = getGoogleAuthAvailability(currentOrigin);
  const allowedOrigins = getGoogleAllowedOrigins();

  if (!googleAuth.enabled) {
    const allowedOriginsLabel =
      allowedOrigins.length > 0 ? allowedOrigins.join(', ') : 'belum diatur';

    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-left backdrop-blur">
        <p className="text-sm font-semibold text-amber-800">Google login belum siap</p>
        <p className="mt-1 text-xs leading-6 text-amber-700">{googleAuth.reason}</p>
        <p className="mt-2 text-xs leading-6 text-amber-700">
          Origin yang diizinkan saat ini: {allowedOriginsLabel}
        </p>
      </div>
    );
  }

  if (!currentOrigin) {
    return null;
  }

  async function handleGoogleLogin(credentialResponse: CredentialResponse) {
    try {
      if (!credentialResponse.credential) {
        throw new Error('No credential received from Google');
      }

      // Send Google token to frontend API route
      const response = await fetch('/api/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: credentialResponse.credential,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || error.error?.message || 'Google login failed');
      }

      const json = await response.json();
      // Response is wrapped: { success: true, data: { access_token, user } }
      const { user } = json.data;

      if (!user?.full_name) {
        throw new Error('User data incomplete');
      }

      setAuth(user);
      toast.success(`Selamat datang, ${user.full_name}!`);
      startTransition(() => {
        router.replace('/dashboard');
        router.refresh();
      });
    } catch (error) {
      console.error('Google login error:', error);
      const message = error instanceof Error ? error.message : 'Google login failed';
      toast.error(message);
    }
  }

  return (
    <div className="w-full flex justify-center">
      <GoogleLogin
        onSuccess={handleGoogleLogin}
        onError={() =>
          toast.error(
            `Login Google gagal. Pastikan origin ${currentOrigin} sudah didaftarkan di Google Cloud Console.`
          )
        }
        text="signin_with"
        width="100"
      />
    </div>
  );
}
