'use client';

import { cn } from '@/lib/utils';

interface ATSScoreCardProps {
  score: number;
  matchedCount: number;
  missingCount: number;
}

export function ATSScoreCard({ score, matchedCount, missingCount }: ATSScoreCardProps) {
  const getScoreColor = () => {
    if (score >= 80) return 'text-emerald-300';
    if (score >= 60) return 'text-amber-300';
    return 'text-rose-300';
  };

  const getBgColor = () => {
    if (score >= 80) return 'border-emerald-500/20 bg-[linear-gradient(180deg,rgba(5,20,15,0.94),rgba(6,48,32,0.72))]';
    if (score >= 60) return 'border-amber-500/20 bg-[linear-gradient(180deg,rgba(20,12,3,0.96),rgba(92,42,10,0.45))]';
    return 'border-rose-500/20 bg-[linear-gradient(180deg,rgba(20,6,10,0.96),rgba(109,40,55,0.42))]';
  };

  const getLabel = () => {
    if (score >= 80) return 'Sangat Baik';
    if (score >= 60) return 'Cukup Baik';
    return 'Perlu Perbaikan';
  };

  const getProgressColor = () => {
    if (score >= 80) return 'bg-emerald-400';
    if (score >= 60) return 'bg-amber-400';
    return 'bg-rose-400';
  };

  return (
    <div className={cn('surface-panel h-full rounded-[28px] p-8', getBgColor())}>
      <div className="text-center mb-6">
        <div className={cn('mb-2 text-5xl font-semibold tracking-[-0.05em]', getScoreColor())}>{score}</div>
        <p className={cn('text-lg font-semibold', getScoreColor())}>{getLabel()}</p>
      </div>

      <div className="mb-6">
        <div className="h-3 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className={cn('h-full rounded-full transition-all duration-500', getProgressColor())}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="surface-subtle rounded-[22px] p-4 text-center">
          <p className="text-2xl font-semibold text-emerald-300">{matchedCount}</p>
          <p className="mt-1 text-sm text-white/55">Keyword Cocok</p>
        </div>
        <div className="surface-subtle rounded-[22px] p-4 text-center">
          <p className="text-2xl font-semibold text-rose-300">{missingCount}</p>
          <p className="mt-1 text-sm text-white/55">Keyword Kurang</p>
        </div>
      </div>
    </div>
  );
}
