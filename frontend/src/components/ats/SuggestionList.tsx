'use client';

import { AlertCircle } from 'lucide-react';

interface SuggestionListProps {
  suggestions: string[];
}

export function SuggestionList({ suggestions }: SuggestionListProps) {
  if (suggestions.length === 0) {
    return (
      <div className="surface-panel border-emerald-500/20 bg-[linear-gradient(180deg,rgba(5,20,15,0.94),rgba(6,48,32,0.72))] p-6 text-center">
        <AlertCircle className="mx-auto mb-2 h-8 w-8 text-emerald-300" />
        <p className="font-semibold text-emerald-200">CV Sudah Optimal!</p>
        <p className="mt-1 text-sm text-emerald-100/80">
          Tidak ada saran perbaikan pada saat ini.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-white">Saran Perbaikan</h3>
      <div className="space-y-2">
        {suggestions.map((suggestion, idx) => (
          <div key={idx} className="surface-subtle flex gap-3 rounded-[22px] border-white/10 p-4">
            <span className="mt-0.5 flex-shrink-0 font-bold text-amber-300">{idx + 1}.</span>
            <p className="text-sm leading-relaxed text-white/70">{suggestion}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
