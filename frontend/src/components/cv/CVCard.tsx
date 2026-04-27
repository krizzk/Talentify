'use client';

import Link from 'next/link';
import { Eye, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';
import type { CV } from '@/types';

interface CVCardProps {
  cv: CV;
  onDelete: (id: string) => void;
  isDeleting?: boolean;
}

export function CVCard({ cv, onDelete, isDeleting }: CVCardProps) {
  return (
    <div className="surface-panel panel-hover flex flex-col gap-5 rounded-[30px] p-5 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-3">
          <h3 className="truncate text-lg font-semibold tracking-[-0.02em] text-slate-950">{cv.title}</h3>
          {cv.public_url && (
            <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-700">
              Public
            </span>
          )}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge
            variant={cv.type === 'tailored' ? 'matched' : 'neutral'}
            className="text-xs"
          >
            {cv.type === 'tailored' ? 'Tailored' : 'Generated'}
          </Badge>
          <Badge
            variant={cv.status === 'finalized' ? 'matched' : 'amber'}
            className="text-xs"
          >
            {cv.status === 'finalized' ? 'Finalized' : 'Draft'}
          </Badge>
        </div>
        <p className="mt-4 text-xs uppercase tracking-[0.18em] text-slate-400">{formatDate(cv.created_at)}</p>
      </div>

      <div className="flex gap-2 w-full sm:w-auto sm:flex-shrink-0">
        <Link href={`/cv/${cv.id}`} className="flex-1 sm:flex-none">
          <Button
            variant="ghost"
            size="sm"
            className="w-full gap-2"
            disabled={isDeleting}
          >
            <Eye className="h-4 w-4" />
            <span className="sm:hidden">Lihat</span>
          </Button>
        </Link>
        <Button
          variant="ghost"
          size="sm"
          className="flex-1 gap-2 text-rose-600 hover:border-rose-200 hover:bg-rose-50 sm:flex-none"
          onClick={() => onDelete(cv.id)}
          isLoading={isDeleting}
          disabled={isDeleting}
        >
          <Trash2 className="h-4 w-4" />
          <span className="sm:hidden">Hapus</span>
        </Button>
      </div>
    </div>
  );
}
