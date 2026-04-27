'use client';

import { GoogleOAuthProvider } from '@react-oauth/google';
import { ReactNode } from 'react';
import {
  getGoogleAuthAvailability,
  getGoogleClientId,
} from '@/lib/auth.utils';

interface GoogleOAuthProviderProps {
  children: ReactNode;
}

export function GoogleOAuthProviderWrapper({ children }: GoogleOAuthProviderProps) {
  const clientId = getGoogleClientId();
  const currentOrigin =
    typeof window !== 'undefined' ? window.location.origin : undefined;
  const googleAuth = getGoogleAuthAvailability(currentOrigin);

  if (!googleAuth.enabled || !clientId) {
    return <>{children}</>;
  }

  return (
    <GoogleOAuthProvider clientId={clientId}>
      {children}
    </GoogleOAuthProvider>
  );
}
