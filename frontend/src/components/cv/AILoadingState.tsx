'use client';

import { useState, useEffect } from 'react';
import { Spinner } from '@/components/ui/Spinner';
import { Reveal } from '@/components/ui/Reveal';

const LOADING_MESSAGES = [
  'Membaca profil kamu...',
  'Menyusun pengalaman kerja...',
  'Mengoptimasi untuk ATS...',
  'Hampir selesai...',
];

export function AILoadingState() {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 2000); // Change message every 2 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <Reveal className="surface-panel-strong mx-auto flex max-w-2xl flex-col items-center justify-center gap-6 px-8 py-12 text-center">
      <div className="pulse-glow rounded-full border border-indigo-100 bg-indigo-50 p-5">
        <Spinner size="lg" />
      </div>
      <div className="text-center">
        <p className="text-lg font-semibold text-slate-950">Membuat CV dengan AI</p>
        <p className="mt-2 h-6 min-h-6 text-sm text-slate-600">
          {LOADING_MESSAGES[currentMessageIndex]}
        </p>
      </div>
      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Proses biasanya memakan waktu 5-10 detik</p>
    </Reveal>
  );
}
