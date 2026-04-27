import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { BottomNav } from '@/components/layout/BottomNav';

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const hasSessionCookie =
    cookieStore.has('access_token') || cookieStore.has('refresh_token');

  // Redirect to login if not authenticated
  if (!hasSessionCookie) {
    redirect('/auth/login');
  }

  return (
    <div className="min-h-screen lg:flex">
      <Sidebar />

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 overflow-y-auto pb-20 lg:pb-4">
          {children}
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
