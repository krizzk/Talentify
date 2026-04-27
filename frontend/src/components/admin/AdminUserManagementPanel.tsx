'use client';

import { useDeferredValue, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { useAdminUsers, useUpdateAdminUser } from '@/hooks/use-admin';
import { formatDate } from '@/lib/utils';
import type { AdminManagedUser } from '@/types';

function UpdateControls({
  user,
}: {
  user: AdminManagedUser;
}) {
  const { mutate: updateUser, isPending } = useUpdateAdminUser();

  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <select
        className="field-select"
        defaultValue={user.plan}
        disabled={isPending}
        onChange={(event) =>
          updateUser({
            id: user.id,
            plan: event.target.value as AdminManagedUser['plan'],
          })
        }
      >
        <option value="free">Free</option>
        <option value="premium">Premium</option>
        <option value="enterprise">Enterprise</option>
      </select>
      <select
        className="field-select"
        defaultValue={user.role}
        disabled={isPending}
        onChange={(event) =>
          updateUser({
            id: user.id,
            role: event.target.value as AdminManagedUser['role'],
          })
        }
      >
        <option value="user">User</option>
        <option value="admin">Admin</option>
      </select>
    </div>
  );
}

export function AdminUserManagementPanel() {
  const [searchInput, setSearchInput] = useState('');
  const deferredSearch = useDeferredValue(searchInput);
  const { data, isLoading, isError } = useAdminUsers(deferredSearch, 1, 20);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            label="Cari user"
            placeholder="Cari nama atau email"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Daftar User</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 lg:max-h-[540px] lg:overflow-auto">
          {isLoading && (
            <div className="flex min-h-[200px] items-center justify-center">
              <Spinner size="lg" />
            </div>
          )}

          {isError && (
            <p className="text-sm text-rose-600">Gagal memuat daftar user admin.</p>
          )}

          {!isLoading && !isError && data?.items.length === 0 && (
            <p className="text-sm text-slate-500">Belum ada user yang cocok dengan pencarian ini.</p>
          )}

          {!isLoading &&
            !isError &&
            data?.items.map((user) => (
              <div
                key={user.id}
                className="surface-subtle rounded-[18px] p-3"
              >
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-slate-950">{user.full_name}</p>
                    <p className="text-xs text-slate-500">{user.email}</p>
                    <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                      <span>Plan: {user.plan}</span>
                      <span>Role: {user.role}</span>
                      <span>CV: {user.cv_count}</span>
                      <span>
                        Joined: {user.created_at ? formatDate(user.created_at) : '-'}
                      </span>
                    </div>
                  </div>
                  <UpdateControls user={user} />
                </div>
              </div>
            ))}
        </CardContent>
      </Card>
    </div>
  );
}
