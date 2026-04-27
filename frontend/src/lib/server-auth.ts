import { cookies } from 'next/headers';
import type { User } from '@/types';

function resolveBackendUrl() {
  return (
    process.env.INTERNAL_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:4000/api'
  );
}

export async function getServerSessionUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;
  const refreshToken = cookieStore.get('refresh_token')?.value;

  if (!accessToken && !refreshToken) {
    return null;
  }

  const backendUrl = resolveBackendUrl();
  const cookieHeader = [
    accessToken ? `access_token=${accessToken}` : null,
    refreshToken ? `refresh_token=${refreshToken}` : null,
  ]
    .filter(Boolean)
    .join('; ');

  let userResponse = await fetch(`${backendUrl}/users/me`, {
    headers: {
      Cookie: cookieHeader,
    },
    cache: 'no-store',
  });

  if (!userResponse.ok && refreshToken) {
    const refreshResponse = await fetch(`${backendUrl}/auth/refresh`, {
      method: 'POST',
      headers: {
        Cookie: `refresh_token=${refreshToken}`,
      },
      cache: 'no-store',
    });

    if (!refreshResponse.ok) {
      return null;
    }

    const refreshJson = await refreshResponse.json();
    const refreshedAccessToken =
      refreshJson?.data?.access_token ?? refreshJson?.access_token ?? null;

    if (!refreshedAccessToken) {
      return null;
    }

    userResponse = await fetch(`${backendUrl}/users/me`, {
      headers: {
        Authorization: `Bearer ${refreshedAccessToken}`,
      },
      cache: 'no-store',
    });
  }

  if (!userResponse.ok) {
    return null;
  }

  const userJson = await userResponse.json();
  return (userJson?.data ?? userJson) as User;
}
