'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { SkeletonCard, SkeletonLine } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { TailorCVClient } from '@/components/cv/TailorCVClient';
import { useGetCV } from '@/hooks/use-cv';
import type { CV } from '@/types';

function TailorPageContent({ cvId }: { cvId: string }) {
  const { data: cv, isLoading, error } = useGetCV(cvId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <SkeletonLine />
        <SkeletonLine />
        <SkeletonCard />
      </div>
    );
  }

  if (error || !cv) {
    return (
      <ErrorState
        message="CV tidak ditemukan"
        onRetry={() => window.location.href = '/dashboard'}
      />
    );
  }

  return (
    <TailorCVClient
      cvId={cvId}
      originalContent={cv.content}
      originalTitle={cv.title}
    />
  );
}

export default function TailorCVPage() {
  const params = useParams();
  const cvId = params.id as string;

  return (
    <div className="page-shell max-w-7xl">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <Link href={`/cv/${cvId}`}>
            <Button variant="ghost">
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              Kembali ke CV
            </Button>
          </Link>
        </div>

        <h1 className="mb-6 text-3xl font-semibold tracking-[-0.03em] text-slate-950">Sesuaikan CV</h1>

        <TailorPageContent cvId={cvId} />
      </div>
    </div>
  );
}
