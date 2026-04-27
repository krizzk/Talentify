import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export default async function RootPage() {
  const cookieStore = await cookies();
  const hasSessionCookie =
    cookieStore.has('access_token') || cookieStore.has('refresh_token');

  if (hasSessionCookie) {
    redirect('/dashboard');
  } else {
    redirect('/auth/login');
  }
}
