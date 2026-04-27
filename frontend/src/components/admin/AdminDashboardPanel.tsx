'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { useAdminDashboard } from '@/hooks/use-admin';
import { formatDate } from '@/lib/utils';

const metricCards: Array<{
  key: keyof ReturnType<typeof mapMetrics>;
  label: string;
}> = [
  { key: 'total_users', label: 'Total Users' },
  { key: 'new_users_this_week', label: 'Users Baru 7 Hari' },
  { key: 'admin_count', label: 'Admin Accounts' },
  { key: 'premium_users', label: 'Premium Users' },
  { key: 'enterprise_users', label: 'Enterprise Users' },
  { key: 'total_cvs', label: 'Total CVs' },
  { key: 'total_ats_analyses', label: 'ATS Analyses' },
];

function mapMetrics(metrics: {
  total_users: number;
  new_users_this_week: number;
  admin_count: number;
  premium_users: number;
  enterprise_users: number;
  total_cvs: number;
  total_ats_analyses: number;
}) {
  return metrics;
}

export function AdminDashboardPanel() {
  const { data, isLoading, isError } = useAdminDashboard();

  if (isLoading) {
    return (
      <div className="flex min-h-[240px] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-red-600">
          Gagal memuat dashboard admin.
        </CardContent>
      </Card>
    );
  }

  const metrics = mapMetrics(data.metrics);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {metricCards.map((card) => (
          <Card key={card.key}>
            <CardContent className="space-y-1.5 py-4">
              <p className="text-xs text-slate-500">{card.label}</p>
              <p className="text-2xl font-semibold tracking-[-0.03em] text-slate-950">{metrics[card.key]}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Terbaru</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 lg:max-h-[340px] lg:overflow-auto">
          {data.recent_users.map((user) => (
            <div
              key={user.id}
              className="surface-subtle flex flex-col gap-1 rounded-[18px] p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-sm font-medium text-slate-950">{user.full_name}</p>
                <p className="text-xs text-slate-500">{user.email}</p>
              </div>
              <div className="text-xs text-slate-500">
                Bergabung {user.created_at ? formatDate(user.created_at) : '-'}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
