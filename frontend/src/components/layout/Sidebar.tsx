'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ArrowUpRight,
  FileText,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useLogout, useMenu } from '@refinedev/core';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import { Reveal } from '@/components/ui/Reveal';
import type { User } from '@/types';

export function Sidebar() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const { menuItems } = useMenu();
  const { mutate: submitLogout } = useLogout();
  const [isOpen, setIsOpen] = useState(false);

  const filterMenuTree = (items: typeof menuItems): typeof menuItems => {
    return items
      .flatMap((item) => {
        const roles = item.meta?.roles as User['role'][] | undefined;

        if (roles && (!user?.role || !roles.includes(user.role))) {
          return [];
        }

        const children = item.children?.length ? filterMenuTree(item.children) : [];

        return [
          {
            ...item,
            children,
          },
        ];
      })
      .filter((item) => !item.meta?.hide);
  };

  const visibleMenuItems = filterMenuTree(menuItems);

  const flattenMenuItems = (
    items: typeof visibleMenuItems,
    depth = 0,
  ): Array<(typeof visibleMenuItems)[number] & { depth: number }> => {
    return items.flatMap((item) => [
      { ...item, depth },
      ...flattenMenuItems(item.children, depth + 1),
    ]);
  };

  const navItems = flattenMenuItems(visibleMenuItems).filter((item) => item.route);

  const handleLogout = () => submitLogout({ redirectPath: '/auth/login' });

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed left-4 top-4 z-50 rounded-2xl border border-slate-200 bg-white p-3 text-slate-700 shadow-[0_18px_32px_rgba(15,23,42,0.12)] backdrop-blur-xl lg:hidden"
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      <Reveal className="hidden lg:block lg:w-[250px] lg:shrink-0 lg:p-4">
        <aside className="surface-panel-strong hero-orb flex min-h-[calc(100vh-2rem)] flex-col justify-between overflow-hidden">
          <div>
            <div className="border-b border-slate-200 px-4 py-4">
              <Link href="/dashboard" className="group flex items-center gap-3">
                <div className="relative h-10 w-10">
                  <div className="absolute inset-0 rounded-lg bg-indigo-600 rotate-45 transition-transform group-hover:scale-105" />
                  <div className="absolute inset-[3px] flex items-center justify-center rounded-lg bg-white text-indigo-600">
                    <FileText className="h-4 w-4" />
                  </div>
                </div>
                <div>
                  <span className="block text-lg font-semibold tracking-[-0.03em] text-gradient">
                    AI Job
                  </span>
                  <span className="text-[10px] uppercase tracking-[0.26em] text-slate-400">
                    Career OS
                  </span>
                </div>
              </Link>
            </div>

            <div className="px-4 pt-4">
              <div className="surface-subtle faint-grid rounded-[20px] p-3">
                <p className="text-[10px] uppercase tracking-[0.22em] text-slate-400">
                  Workspace
                </p>
                <p className="mt-1.5 text-[13px] leading-6 text-slate-600">
                  Resource-driven workspace berbasis Refine untuk CV, ATS, dan career operations.
                </p>
              </div>
            </div>

            <nav className="space-y-1.5 px-3 py-4">
              {navItems.map((item, index) => {
                const isNested = item.depth > 0;
                const isActive =
                  pathname === item.route ||
                  pathname.startsWith(`${item.route ?? ''}/`) ||
                  (item.route !== '/dashboard' && pathname.startsWith(item.route ?? ''));

                return (
                  <Link
                    key={item.key}
                    href={item.route ?? '/dashboard'}
                    className={cn(
                      'group flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-medium transition duration-300',
                      isNested && 'ml-4 text-[12px]',
                      isActive
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                        : 'text-slate-600 hover:-translate-y-0.5 hover:bg-indigo-50 hover:text-indigo-700'
                    )}
                    style={{ animationDelay: `${index * 70}ms` }}
                  >
                    <span
                      className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-xl border transition duration-300',
                        isNested && 'h-7 w-7',
                        isActive
                          ? 'border-white/20 bg-white/15 text-white'
                          : 'border-slate-200 bg-white text-indigo-600 group-hover:border-indigo-200'
                      )}
                    >
                      {item.icon}
                    </span>
                    <span className="flex-1">{item.label}</span>
                    <ArrowUpRight
                      className={cn(
                        'h-4 w-4 opacity-0 transition duration-300 group-hover:translate-x-0.5 group-hover:opacity-100',
                        isActive && 'opacity-100'
                      )}
                    />
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="border-t border-slate-200 p-3">
            <div className="surface-subtle flex items-center gap-3 px-3 py-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-xs font-semibold text-white">
                {user?.full_name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold text-slate-900">{user?.full_name}</p>
                <p className="truncate text-xs text-slate-500">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="mt-2.5 flex w-full items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-[13px] font-semibold text-rose-600 hover:-translate-y-0.5 hover:bg-rose-100"
            >
              <LogOut className="h-5 w-5" />
              <span>Keluar</span>
            </button>
          </div>
        </aside>
      </Reveal>

      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <div
        className={cn(
          'fixed inset-y-3 left-3 z-50 flex w-[288px] flex-col justify-between rounded-[30px] border border-slate-200 bg-white/95 shadow-[0_22px_50px_rgba(15,23,42,0.16)] backdrop-blur-2xl transition-transform duration-300 ease-out lg:hidden',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div>
          <div className="border-b border-slate-200 p-6">
            <Link href="/dashboard" className="flex items-center gap-3" onClick={() => setIsOpen(false)}>
              <div className="relative h-11 w-11">
                <div className="absolute inset-0 rounded-lg bg-indigo-600 rotate-45" />
                <div className="absolute inset-[3px] flex items-center justify-center rounded-lg bg-white text-indigo-600">
                  <FileText className="h-4 w-4" />
                </div>
              </div>
              <div>
                <span className="block text-lg font-semibold text-gradient">AI Job</span>
                <span className="text-xs uppercase tracking-[0.24em] text-slate-400">Career OS</span>
              </div>
            </Link>
          </div>

          <nav className="space-y-2 p-4">
            {navItems.map((item) => {
              const isNested = item.depth > 0;
              const isActive =
                pathname === item.route || pathname.startsWith(`${item.route ?? ''}/`);

              return (
                <Link
                  key={item.key}
                  href={item.route ?? '/dashboard'}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition duration-300',
                    isNested && 'ml-4 text-[13px]',
                    isActive
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-600 hover:bg-indigo-50 hover:text-indigo-700'
                  )}
                >
                  <span
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-2xl border',
                      isNested && 'h-9 w-9',
                      isActive
                        ? 'border-white/20 bg-white/15'
                        : 'border-slate-200 bg-white text-indigo-600'
                    )}
                  >
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="border-t border-slate-200 p-4">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600"
          >
            <LogOut className="h-5 w-5" />
            <span>Keluar</span>
          </button>
        </div>
      </div>
    </>
  );
}
