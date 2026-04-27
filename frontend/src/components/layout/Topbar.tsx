'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, CreditCard, LogOut, Settings, Sparkles, User } from 'lucide-react';
import { useGetIdentity, useLogout } from '@refinedev/core';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import { Reveal } from '@/components/ui/Reveal';
import type { User as AppUser } from '@/types';

export function Topbar() {
  const storedUser = useAuthStore((s) => s.user);
  const { data: identity } = useGetIdentity<AppUser>();
  const user = identity ?? storedUser;
  const { mutate: submitLogout } = useLogout();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => submitLogout({ redirectPath: '/auth/login' });

  return (
    <Reveal className="px-3 pt-3 lg:px-4 lg:pt-4">
      <header className="surface-panel flex min-h-14 items-center justify-between gap-3 px-3 py-2.5 lg:px-4">
        <div className="w-8 lg:hidden" />

        <div className="hidden lg:block">
          <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">Control Deck</p>
          <h1 className="mt-0.5 text-[15px] font-semibold tracking-[-0.02em] text-slate-950">
            Halo, {user?.full_name?.split(' ')[0]}.
          </h1>
        </div>

        <div className="flex items-center gap-1.5">
          <div className="hidden items-center gap-1.5 rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-1.5 text-[11px] font-semibold text-indigo-700 md:flex">
            <Sparkles className="h-3 w-3 text-indigo-500" />
            Refine cockpit active
          </div>

          {user?.plan && user.plan !== 'free' && (
            <span
              className={cn(
                'pill-badge uppercase tracking-[0.2em]',
                user.plan === 'premium' && 'border-blue-200 bg-blue-50 text-blue-700',
                user.plan === 'enterprise' && 'border-violet-200 bg-violet-50 text-violet-700'
              )}
            >
              {user.plan.toUpperCase()}
            </span>
          )}

          <div className="relative">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2 py-1.5 hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-indigo-50"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-xs font-semibold text-white">
                {user?.full_name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <ChevronDown className="hidden h-4 w-4 text-slate-400 lg:block" />
            </button>

            {isMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsMenuOpen(false)} />
                <div className="surface-panel absolute right-0 z-20 mt-3 w-56 overflow-hidden py-2">
                  <div className="border-b border-slate-200 px-4 py-3">
                    <p className="text-sm font-semibold text-slate-950">{user?.full_name}</p>
                    <p className="text-xs text-slate-500">{user?.email}</p>
                  </div>
                  <Link
                    href="/profile"
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-600 hover:bg-indigo-50 hover:text-indigo-700"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <User className="h-4 w-4" />
                    Profil
                  </Link>
                  <Link
                    href="/settings"
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-600 hover:bg-indigo-50 hover:text-indigo-700"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <CreditCard className="h-4 w-4" />
                    Plan
                  </Link>
                  <Link
                    href="/settings"
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-600 hover:bg-indigo-50 hover:text-indigo-700"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Settings className="h-4 w-4" />
                    Pengaturan
                  </Link>
                  <div className="mx-3 my-2 border-t border-slate-200" />
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50"
                  >
                    <LogOut className="h-4 w-4" />
                    Keluar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>
    </Reveal>
  );
}
