'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeftIcon, SparklesIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { CVPreview } from '@/components/cv/CVPreview';
import { useTailorCV } from '@/hooks/use-cv';
import type { CV } from '@/types';
import { Reveal } from '@/components/ui/Reveal';

interface TailorCVClientProps {
  cvId: string;
  originalContent: CV['content'];
  originalTitle: string;
}

type TailorState = 'idle' | 'loading' | 'success' | 'error';

const LOADING_MESSAGES = [
  'Mengubah CV untuk posisi yang Dituju...',
  'Menyesuaikan kata kunci...',
  'Mengoptimasi untuk ATS...',
  'Hampir selesai...',
];

export function TailorCVClient({ cvId, originalContent, originalTitle }: TailorCVClientProps) {
  const [jobDescription, setJobDescription] = useState('');
  const [tailoredCV, setTailoredCV] = useState<CV['content'] | null>(null);
  const [state, setState] = useState<TailorState>('idle');

  const { mutate: tailorCV, isPending } = useTailorCV(cvId);

  const handleTailor = () => {
    if (!jobDescription.trim()) {
      alert('Mohon masukkan job description terlebih dahulu');
      return;
    }

    setState('loading');
    tailorCV(jobDescription, {
      onSuccess: (cv) => {
        setTailoredCV(cv.content);
        setState('success');
      },
      onError: () => {
        setState('error');
      },
    });
  };

  const handleReset = () => {
    setJobDescription('');
    setTailoredCV(null);
    setState('idle');
  };

  const handleRetry = () => {
    setState('idle');
    setTailoredCV(null);
  };

  if (state === 'success' && tailoredCV) {
    return (
      <div className="space-y-6">
        <Reveal className="surface-panel border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
          <p className="font-semibold">CV berhasil disesuaikan!</p>
          <p className="mt-1 text-sm text-emerald-700">
            CV telah dioptimasi untuk posisi yang Anda tujuan.
          </p>
        </Reveal>

        <div className="grid lg:grid-cols-2 gap-6">
          <Reveal className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-950">CV Asli</h3>
            <CVPreview content={originalContent} />
          </Reveal>
          <Reveal delay={90} className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-950">CV yang Disesuaikan</h3>
            <CVPreview content={tailoredCV} />
          </Reveal>
        </div>

        <div className="flex gap-3">
          <Button variant="ghost" onClick={handleReset} className="flex-1">
            Sesuaikan Lagi
          </Button>
          <Link href="/dashboard" className="flex-1">
            <Button variant="primary" className="w-full">
              Ke Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {state === 'idle' && (
        <div className="grid lg:grid-cols-2 gap-8">
          <Reveal className="surface-panel-strong space-y-4 p-6">
            <div>
              <h2 className="mb-2 text-2xl font-semibold tracking-[-0.03em] text-slate-950">Sesuaikan CV</h2>
              <p className="text-sm leading-8 text-slate-600">
                Masukkan job description untuk menyesuaikan CV Anda agar lebih match dengan posisi yang diinginkan.
              </p>
            </div>

            <div>
              <label className="field-label">
                Job Description
              </label>
              <textarea
                placeholder="Paste job description di sini..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                maxLength={5000}
                rows={12}
                className="field-textarea min-h-[320px]"
              />
            </div>

            <Button
              variant="primary"
              onClick={handleTailor}
              disabled={!jobDescription.trim() || isPending}
              className="w-full"
            >
              <SparklesIcon className="w-4 h-4 mr-2" />
              Sesuaikan CV
            </Button>
          </Reveal>

          <Reveal delay={90} className="surface-panel p-6">
            <h3 className="mb-4 text-lg font-semibold text-slate-950">CV Asli</h3>
            <CVPreview content={originalContent} />
          </Reveal>
        </div>
      )}

      {state === 'loading' && (
        <div className="surface-panel-strong flex flex-col items-center justify-center gap-4 py-16">
          <Spinner size="lg" />
          <p className="text-slate-600">Menyesuaikan CV...</p>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Proses ini biasanya memakan waktu 10-30 detik</p>
        </div>
      )}

      {state === 'error' && (
        <ErrorState
          message="Gagal menyesuaikan CV"
          description="Terjadi kesalahan saat menyesuaikan CV Anda. Silakan coba lagi."
          onRetry={handleRetry}
        />
      )}
    </div>
  );
}
