'use client';

import { useState } from 'react';
import { SparklesIcon, ArrowLeftIcon } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { ATSScoreCard } from '@/components/ats/ATSScoreCard';
import { KeywordList } from '@/components/ats/KeywordBadge';
import { SuggestionList } from '@/components/ats/SuggestionList';
import { useAnalyzeATS } from '@/hooks/use-ats';
import type { ATSAnalysisResult } from '@/types';
import { Reveal } from '@/components/ui/Reveal';

interface ATSAnalyzerProps {
  cvId: string;
}

type AnalyzerState = 'idle' | 'loading' | 'success' | 'error';

export function ATSAnalyzer({ cvId }: ATSAnalyzerProps) {
  const [jobDescription, setJobDescription] = useState('');
  const [result, setResult] = useState<ATSAnalysisResult | null>(null);
  const [state, setState] = useState<AnalyzerState>('idle');

  const { mutate: analyzeATS, isPending } = useAnalyzeATS(cvId);

  const handleAnalyze = () => {
    if (!jobDescription.trim()) {
      alert('Mohon masukkan job description terlebih dahulu');
      return;
    }

    setState('loading');
    analyzeATS(jobDescription, {
      onSuccess: (data) => {
        setResult(data);
        setState('success');
      },
      onError: () => {
        setState('error');
      },
    });
  };

  const handleReset = () => {
    setJobDescription('');
    setResult(null);
    setState('idle');
  };

  const handleRetry = () => {
    setState('idle');
    setResult(null);
  };

  return (
    <div className="space-y-6">
      <Link href={`/cv/${cvId}`}>
        <Button variant="ghost">
          <ArrowLeftIcon className="w-4 h-4 mr-2" />
          Kembali ke CV
        </Button>
      </Link>

      {state === 'idle' && (
        <div className="grid lg:grid-cols-2 gap-8">
          <Reveal className="surface-panel-strong space-y-4 p-6">
            <div>
              <h2 className="mb-2 text-2xl font-semibold tracking-[-0.03em] text-white">Analisis ATS</h2>
              <p className="text-sm leading-7 text-white/65">
                Paste job description di bawah untuk menganalisis seberapa baik CV Anda match
                dengan posisi yang Anda tuju.
              </p>
            </div>

            <textarea
              placeholder="Paste job description di sini..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              maxLength={5000}
              rows={12}
              className="field-textarea min-h-[320px]"
            />

            <Button
              variant="primary"
              onClick={handleAnalyze}
              disabled={!jobDescription.trim() || isPending}
              className="w-full"
            >
              <SparklesIcon className="w-4 h-4 mr-2" />
              Analisis Sekarang
            </Button>
          </Reveal>

          <Reveal delay={90} className="surface-panel-strong hero-orb flex min-h-[400px] flex-col items-center justify-center p-8 text-center">
            <div className="pulse-glow mb-4 rounded-[28px] bg-[linear-gradient(135deg,#ef4444,#f59e0b)] p-4 text-white shadow-[0_18px_40px_rgba(245,158,11,0.24)]">
              <SparklesIcon className="h-10 w-10" />
            </div>
            <h3 className="mb-1 text-xl font-semibold text-white">
              Ready untuk dianalisis?
            </h3>
            <p className="text-sm leading-7 text-white/65">
              Masukkan job description dan klik &quot;Analisis Sekarang&quot; untuk melihat ATS
              score, keyword match, dan saran perbaikan.
            </p>
          </Reveal>
        </div>
      )}

      {state === 'loading' && (
        <div className="surface-panel-strong flex flex-col items-center justify-center gap-4 py-16">
          <Spinner size="lg" />
          <p className="text-white/65">Menganalisis CV Anda...</p>
          <p className="text-xs uppercase tracking-[0.2em] text-white/45">Proses biasanya memakan waktu 10-30 detik</p>
        </div>
      )}

      {state === 'success' && result && (
        <div className="space-y-6">
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <ATSScoreCard
                score={result.ats_score}
                matchedCount={result.matched_keywords.length}
                missingCount={result.missing_keywords.length}
              />
            </div>

            <div className="surface-panel lg:col-span-2 p-6">
              <h3 className="mb-4 text-lg font-semibold text-white">Ringkasan</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/55">ATS Score</span>
                  <span className="font-semibold text-white">{result.ats_score}/100</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/55">Keyword Match</span>
                  <span className="font-semibold text-white">
                    {result.matched_keywords.length}/{result.matched_keywords.length + result.missing_keywords.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/55">Match Rate</span>
                  <span className="font-semibold text-white">
                    {Math.round(
                      (result.matched_keywords.length /
                        (result.matched_keywords.length + result.missing_keywords.length)) *
                        100
                    )}%
                  </span>
                </div>
              </div>

              <div className="mt-6 border-t border-white/10 pt-6">
                <Button variant="ghost" onClick={handleReset} className="w-full">
                  Analisis Job Description Lain
                </Button>
              </div>
            </div>
          </div>

          <div className="surface-panel p-6">
            <KeywordList
              matchedKeywords={result.matched_keywords}
              missingKeywords={result.missing_keywords}
            />
          </div>

          <div className="surface-panel p-6">
            <SuggestionList suggestions={result.suggestions} />
          </div>

          <div className="flex gap-3">
            <Button variant="ghost" onClick={handleReset} className="flex-1">
              Analisis Lagi
            </Button>
            <Link href={`/cv/${cvId}`} className="flex-1">
              <Button variant="primary" className="w-full">
                Kembali ke CV
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Error State */}
      {state === 'error' && (
        <ErrorState
          message="Gagal menganalisis CV"
          description="Terjadi kesalahan saat menganalisis CV Anda. Silakan coba lagi."
          onRetry={handleRetry}
        />
      )}
    </div>
  );
}
