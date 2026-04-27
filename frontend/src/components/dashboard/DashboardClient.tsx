'use client';

import Link from 'next/link';
import {
  ArrowUpRight,
  FileText,
  Gauge,
  Orbit,
  Plus,
  Sparkles,
  Target,
} from 'lucide-react';
import { useCVList, useDeleteCV } from '@/hooks/use-cv';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/ui/Button';
import { CVCard } from '@/components/cv/CVCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { Reveal } from '@/components/ui/Reveal';

export function DashboardClient() {
  const user = useAuthStore((s) => s.user);
  const { data: cvs, isLoading, isError, refetch } = useCVList();
  const { mutate: deleteCV, isPending: isDeleting } = useDeleteCV();

  const cvCount = cvs?.length ?? 0;
  const tailoredCount = cvs?.filter((cv) => cv.type === 'tailored').length ?? 0;
  const finalizedCount = cvs?.filter((cv) => cv.status === 'finalized').length ?? 0;
  const completionRate = cvCount > 0 ? Math.round((finalizedCount / cvCount) * 100) : 0;

  const handleDelete = (cvId: string) => {
    if (window.confirm('Yakin ingin menghapus CV ini?')) {
      deleteCV(cvId);
    }
  };

  return (
    <div className="page-shell max-w-7xl">
      <Reveal className="surface-panel-strong hero-orb mb-8 overflow-hidden p-6 sm:p-8 lg:p-10">
        <div className="grid gap-8 lg:grid-cols-[1.45fr_0.9fr]">
          <div>
            <div className="pill-badge gap-2">
              <Orbit className="h-3.5 w-3.5 text-indigo-500" />
              Refine-powered career workspace
            </div>
            <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-[-0.05em] text-slate-950 sm:text-5xl">
              Halo, {user?.full_name}. Semua workflow CV Anda sekarang terkumpul dalam satu cockpit.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-8 text-slate-600 sm:text-base">
              Gunakan dashboard ini sebagai mission control untuk generate CV, tailoring,
              ATS analysis, dan pengelolaan public resume tanpa bolak-balik halaman.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/cv/new">
                <Button className="gap-2">
                  <Plus className="h-5 w-5" />
                  <span>Buat CV Baru</span>
                </Button>
              </Link>
              <Link href="/profile">
                <Button variant="secondary" className="gap-2">
                  <Target className="h-4 w-4" />
                  Lengkapi Profil
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <div className="surface-subtle faint-grid rounded-[28px] p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Total CV</p>
                <FileText className="h-5 w-5 text-indigo-500" />
              </div>
              <p className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-slate-950">{cvCount}</p>
              <p className="mt-2 text-sm text-slate-600">Semua draft dan hasil generate aktif Anda.</p>
            </div>
            <div className="surface-subtle rounded-[28px] p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Tailored</p>
                <Sparkles className="h-5 w-5 text-violet-500" />
              </div>
              <p className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-slate-950">{tailoredCount}</p>
              <p className="mt-2 text-sm text-slate-600">Versi yang sudah dioptimasi untuk role tertentu.</p>
            </div>
          </div>
        </div>
      </Reveal>

      <div className="grid gap-6 xl:grid-cols-[1.45fr_0.85fr]">
        <div className="space-y-6">
          <Reveal delay={90} className="mb-1 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-[-0.03em] text-slate-950">CV Mission Board</h2>
              <p className="mt-1 text-sm text-slate-600">
                Semua draft, hasil generate, dan versi tailor tersusun rapi di sini.
              </p>
            </div>
          </Reveal>

          {isLoading && (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <SkeletonCard key={i} count={2} />
              ))}
            </div>
          )}

          {isError && (
            <ErrorState
              message="Gagal memuat daftar CV"
              description="Coba refresh halaman atau hubungi support"
              onRetry={() => refetch()}
            />
          )}

          {!isLoading && !isError && (!cvs || cvs.length === 0) && (
            <EmptyState
              title="Belum ada CV"
              description="Mulai dengan membuat CV pertamamu menggunakan AI"
              action={{
                label: 'Buat CV Pertama',
                onClick: () => (window.location.href = '/cv/new'),
              }}
            />
          )}

          {!isLoading && !isError && cvs && cvs.length > 0 && (
            <div className="space-y-4">
              {cvs.map((cv, index) => (
                <Reveal key={cv.id} delay={index * 70}>
                  <CVCard
                    cv={cv}
                    onDelete={handleDelete}
                    isDeleting={isDeleting}
                  />
                </Reveal>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <Reveal delay={120} className="surface-panel p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Completion Pulse</p>
                <p className="mt-2 text-4xl font-semibold tracking-[-0.05em] text-slate-950">{completionRate}%</p>
              </div>
              <Gauge className="h-10 w-10 text-indigo-500" />
            </div>
            <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-indigo-600"
                style={{ width: `${completionRate}%` }}
              />
            </div>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Persentase CV yang sudah mencapai status finalized dari total workspace Anda.
            </p>
          </Reveal>

          <Reveal delay={180} className="surface-panel p-5">
            <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Quick Routes</p>
            <div className="mt-4 grid gap-3">
              <Link
                href="/cv/new"
                className="surface-subtle flex items-center justify-between rounded-[22px] px-4 py-4 text-sm text-slate-700 transition hover:-translate-y-0.5 hover:bg-indigo-50 hover:text-indigo-700"
              >
                <span>Mulai CV baru dengan AI</span>
                <ArrowUpRight className="h-4 w-4 text-indigo-500" />
              </Link>
              <Link
                href="/profile"
                className="surface-subtle flex items-center justify-between rounded-[22px] px-4 py-4 text-sm text-slate-700 transition hover:-translate-y-0.5 hover:bg-indigo-50 hover:text-indigo-700"
              >
                <span>Perbarui data profil</span>
                <ArrowUpRight className="h-4 w-4 text-indigo-500" />
              </Link>
              <Link
                href="/settings"
                className="surface-subtle flex items-center justify-between rounded-[22px] px-4 py-4 text-sm text-slate-700 transition hover:-translate-y-0.5 hover:bg-indigo-50 hover:text-indigo-700"
              >
                <span>Kelola plan dan billing</span>
                <ArrowUpRight className="h-4 w-4 text-indigo-500" />
              </Link>
            </div>
          </Reveal>

          {user?.plan === 'free' && (
            <Reveal delay={220} className="surface-panel border-indigo-200 bg-indigo-50 p-5">
              <p className="text-sm leading-7 text-slate-700">
                Kamu menggunakan <strong>Free Plan</strong>. Upgrade ke Premium untuk akses unlimited CV
                generation dan ATS analysis.
              </p>
            </Reveal>
          )}
        </div>
      </div>
    </div>
  );
}
