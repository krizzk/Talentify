'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { useContentModeration } from '@/hooks/use-admin';
import { formatDate } from '@/lib/utils';

const severityVariant = {
  low: 'neutral',
  medium: 'amber',
  high: 'missing',
} as const;

export function AdminContentModerationPanel() {
  const { data, isLoading, isError } = useContentModeration();

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
          Gagal memuat data moderation.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="py-4">
            <p className="text-xs text-slate-500">Reviewed Items</p>
            <p className="mt-1.5 text-2xl font-semibold tracking-[-0.03em] text-slate-950">{data.summary.total_reviewed}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-xs text-slate-500">Flagged Items</p>
            <p className="mt-1.5 text-2xl font-semibold tracking-[-0.03em] text-slate-950">{data.summary.flagged}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-xs text-slate-500">High Risk</p>
            <p className="mt-1.5 text-2xl font-semibold tracking-[-0.03em] text-rose-600">{data.summary.high_risk}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-xs text-slate-500">Medium Risk</p>
            <p className="mt-1.5 text-2xl font-semibold text-amber-600">{data.summary.medium_risk}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Review Queue</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 lg:max-h-[520px] lg:overflow-auto">
          {data.items.length === 0 && (
            <p className="text-sm text-slate-500">Belum ada konten yang perlu dimoderasi.</p>
          )}

          {data.items.map((item) => (
            <div key={item.id} className="surface-subtle rounded-[18px] p-3">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-slate-950">{item.title}</p>
                    <Badge variant={severityVariant[item.severity]}>{item.severity}</Badge>
                  </div>
                  <p className="text-xs text-slate-500">
                    {item.user?.full_name} • {item.user?.email}
                  </p>
                  <p className="text-sm text-slate-600">{item.preview || 'Tidak ada preview.'}</p>
                  <div className="flex flex-wrap gap-2">
                    {item.reasons.map((reason) => (
                      <Badge key={reason} variant="amber">
                        {reason}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="text-xs text-slate-500">
                  Updated {formatDate(item.updated_at)}
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
