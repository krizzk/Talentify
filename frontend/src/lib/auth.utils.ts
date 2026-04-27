function normalizeOrigin(origin: string): string {
  return origin.trim().replace(/\/$/, '');
}

export function getAuthHeader(): Record<string, string> {
  return {};
}

export async function withAuth<T>(
  fetcher: (headers: Record<string, string>) => Promise<T>,
): Promise<T> {
  return fetcher(getAuthHeader());
}

export function isGoogleAuthFeatureEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_GOOGLE_AUTH === 'true';
}

export function getGoogleClientId(): string {
  return process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() ?? '';
}

export function getGoogleAllowedOrigins(): string[] {
  return (process.env.NEXT_PUBLIC_GOOGLE_ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((origin) => normalizeOrigin(origin))
    .filter(Boolean);
}

export function getGoogleAuthAvailability(currentOrigin?: string): {
  enabled: boolean;
  reason?: string;
} {
  if (!isGoogleAuthFeatureEnabled()) {
    return {
      enabled: false,
      reason: 'Login Google sedang dinonaktifkan di environment ini.',
    };
  }

  if (!getGoogleClientId()) {
    return {
      enabled: false,
      reason: 'Google Client ID belum diatur.',
    };
  }

  const allowedOrigins = getGoogleAllowedOrigins();
  if (!currentOrigin || allowedOrigins.length === 0) {
    return { enabled: true };
  }

  const normalizedOrigin = normalizeOrigin(currentOrigin);
  if (!allowedOrigins.includes(normalizedOrigin)) {
    return {
      enabled: false,
      reason: `Origin ${normalizedOrigin} belum diizinkan untuk Google OAuth.`,
    };
  }

  return { enabled: true };
}
