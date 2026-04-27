'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { useSystemHealth } from '@/hooks/use-admin';
import { formatDate } from '@/lib/utils';

const serviceVariant = {
  healthy: 'matched',
  unhealthy: 'missing',
} as const;

export function AdminSystemHealthPanel() {
  const { data, isLoading, isError } = useSystemHealth();

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
        <CardContent className="py-8 text-center text-sm text-rose-600">
          Gagal memuat status sistem.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-3">
        {(Object.entries(data.services) as Array<
          [keyof typeof data.services, (typeof data.services)[keyof typeof data.services]]
        >).map(([service, status]) => (
          <Card key={service}>
            <CardContent className="flex items-center justify-between py-4">
              <div>
                <p className="text-xs capitalize text-slate-500">{service}</p>
                <p className="mt-1 text-xl font-semibold capitalize text-slate-950">{status}</p>
              </div>
              <Badge variant={serviceVariant[status]}>{status}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Runtime</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5 text-sm text-slate-600">
            <p>Environment: <span className="font-medium">{data.environment}</span></p>
            <p>Updated: <span className="font-medium">{formatDate(data.timestamp)}</span></p>
            <p>Uptime: <span className="font-medium">{data.uptime_seconds} detik</span></p>
          </div>
          <div className="space-y-1.5 text-sm text-slate-600">
            <p>RSS: <span className="font-medium">{data.runtime.rss_mb} MB</span></p>
            <p>Heap Used: <span className="font-medium">{data.runtime.heap_used_mb} MB</span></p>
            <p>Heap Total: <span className="font-medium">{data.runtime.heap_total_mb} MB</span></p>
            <p>External: <span className="font-medium">{data.runtime.external_mb} MB</span></p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
