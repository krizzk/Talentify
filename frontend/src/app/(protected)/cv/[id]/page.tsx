'use client';

import { Suspense, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon, SparklesIcon, WandIcon, DownloadIcon, ExternalLinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { CVPreview } from '@/components/cv/CVPreview';
import { ErrorState } from '@/components/ui/ErrorState';
import { SkeletonLine, SkeletonCard } from '@/components/ui/Skeleton';
import { useGetCV } from '@/hooks/use-cv';
import api from '@/lib/api';
import { Reveal } from '@/components/ui/Reveal';

function CVDetailContent({ cvId }: { cvId: string }) {
  const { data: cv, isLoading, error } = useGetCV(cvId);
  const [downloading, setDownloading] = useState(false);

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      const response = await api.get(`/cv/${cvId}/export/pdf`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `cv-${cv?.title || 'document'}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
      alert('Gagal mengunduh PDF');
    } finally {
      setDownloading(false);
    }
  };

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
        message="CV tidak ditemukan. Silakan coba lagi."
        onRetry={() => window.location.href = '/dashboard'}
      />
    );
  }

  return (
    <div className="space-y-6">
      <Reveal className="surface-panel flex flex-wrap gap-3 p-4">
        {cv.public_url && (
          <Link href={cv.public_url} target="_blank">
            <Button variant="secondary" size="sm">
              <ExternalLinkIcon className="w-4 h-4 mr-2" />
              Lihat Landing Page
            </Button>
          </Link>
        )}
        <Link href={`/cv/${cvId}/ats`}>
          <Button variant="primary" size="sm">
            <SparklesIcon className="w-4 h-4 mr-2" />
            Analisis ATS
          </Button>
        </Link>
        <Link href={`/cv/${cvId}/tailor`}>
          <Button variant="secondary" size="sm">
            <WandIcon className="w-4 h-4 mr-2" />
            Sesuaikan CV
          </Button>
        </Link>
        <Button variant="secondary" size="sm" onClick={handleDownloadPDF} disabled={downloading}>
          {downloading ? (
            <Spinner size="sm" />
          ) : (
            <DownloadIcon className="w-4 h-4 mr-2" />
          )}
          Download PDF
        </Button>
      </Reveal>

      {cv.public_url && (
        <Reveal className="surface-panel border-emerald-200 bg-[linear-gradient(135deg,rgba(255,255,255,0.92),rgba(236,253,245,0.95))] p-4 text-sm text-emerald-900">
          Landing page publik kamu siap dibagikan di{' '}
          <Link href={cv.public_url} target="_blank" className="font-semibold underline">
            {cv.public_url}
          </Link>
        </Reveal>
      )}

      <CVPreview content={cv.content} />
    </div>
  );
}

export default function CVDetailPage() {
  const params = useParams();
  const cvId = params.id as string;

  return (
    <div className="page-shell max-w-5xl">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6">
          <Link href="/dashboard">
            <Button variant="ghost">
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              Kembali ke Dashboard
            </Button>
          </Link>
        </div>

        <Suspense fallback={
          <div className="space-y-4">
            <SkeletonLine />
            <SkeletonLine />
            <SkeletonCard />
          </div>
        }>
          <CVDetailContent cvId={cvId} />
        </Suspense>
      </div>
    </div>
  );
}
