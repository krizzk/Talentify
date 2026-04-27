import { redirect } from 'next/navigation';
import { AdminNav } from '@/components/admin/AdminNav';
import { getServerSessionUser } from '@/lib/server-auth';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getServerSessionUser();

  if (!user) {
    redirect('/auth/login');
  }

  if (user.role !== 'admin') {
    redirect('/dashboard');
  }

  return (
    <div className="page-shell space-y-4">
      <div className="surface-panel-strong hero-orb overflow-hidden px-4 py-4">
        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-400">
          Admin Panel
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-950">
          Operational Control Center
        </h1>
        <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-600">
          Kelola user, pantau kualitas konten, dan cek kesehatan sistem dari satu tempat.
        </p>
      </div>
      <AdminNav />
      {children}
    </div>
  );
}
