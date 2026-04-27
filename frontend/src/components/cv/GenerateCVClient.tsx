'use client';

import { WandIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { AILoadingState } from '@/components/cv/AILoadingState';
import { useGenerateCV } from '@/hooks/use-cv';
import { Reveal } from '@/components/ui/Reveal';

export function GenerateCVClient() {
  const { mutate: generateCV, isPending, isError, reset } = useGenerateCV();

  const handleGenerate = () => {
    generateCV();
  };

  const handleRetry = () => {
    reset();
    handleGenerate();
  };

  return (
    <div className="page-shell max-w-5xl py-10">
      <div className="mx-auto max-w-4xl">
        {isPending && <AILoadingState />}

        {isError && (
          <ErrorState
            message="Gagal membuat CV. Silakan coba lagi."
            onRetry={handleRetry}
          />
        )}

        {!isPending && !isError && (
          <Reveal className="surface-panel-strong hero-orb overflow-hidden p-8 text-center sm:p-12">
            <div className="mb-6 flex justify-center">
              <div className="pulse-glow flex h-20 w-20 items-center justify-center rounded-[30px] bg-indigo-600 text-white shadow-[0_22px_44px_rgba(79,70,229,0.22)]">
                <WandIcon className="h-9 w-9" />
              </div>
            </div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-400">AI Generation</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-slate-950">
              Generate CV dengan AI
            </h1>
            <p className="mx-auto mb-8 mt-4 max-w-2xl text-sm leading-8 text-slate-600 sm:text-base">
              AI akan merangkum profilmu, menyusun CV profesional, lalu mempublikasikannya sebagai landing page personal yang siap dibagikan.
            </p>
            <Button variant="primary" size="lg" onClick={handleGenerate} disabled={isPending}>
              <WandIcon className="w-5 h-5 mr-2" />
              Generate CV
            </Button>
          </Reveal>
        )}
      </div>
    </div>
  );
}
