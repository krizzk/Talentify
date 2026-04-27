'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMenu } from '@refinedev/core';
import { useAuthStore } from '@/store/auth.store';
import { cn } from '@/lib/utils';
import type { User } from '@/types';

export function BottomNav() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const { menuItems } = useMenu();

  const navItems = menuItems
    .filter((item) => {
      const roles = item.meta?.roles as User['role'][] | undefined;
      return !roles || (user?.role ? roles.includes(user.role) : false);
    })
    .filter((item) => item.route)
    .slice(0, 5);

  return (
    <nav className="fixed inset-x-4 bottom-4 z-30 rounded-[28px] border border-slate-200 bg-white/95 px-2 py-2 shadow-[0_22px_48px_rgba(15,23,42,0.12)] backdrop-blur-2xl lg:hidden">
      <div className="flex justify-around gap-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.route ||
            (item.route !== '/dashboard' && pathname.startsWith(item.route ?? ''));

          return (
            <Link
              key={item.key}
              href={item.route ?? '/dashboard'}
              className={cn(
                'flex min-w-0 flex-1 flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-medium transition duration-300',
                isActive
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                  : 'text-slate-500'
              )}
            >
              <span className="h-5 w-5">{item.icon}</span>
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
