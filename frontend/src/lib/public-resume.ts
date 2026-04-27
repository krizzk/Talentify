import type { PublicResumePayload } from '@/types';

function resolveBackendUrl() {
  return (
    process.env.INTERNAL_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:4000/api'
  );
}

export async function getPublicResume(slug: string): Promise<PublicResumePayload | null> {
  const response = await fetch(`${resolveBackendUrl()}/cv/public/${slug}`, {
    cache: 'no-store',
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error('Failed to load public resume');
  }

  const payload = await response.json();
  return (payload?.data ?? payload) as PublicResumePayload;
}
