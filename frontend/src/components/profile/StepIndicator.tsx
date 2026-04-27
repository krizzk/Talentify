'use client';

import { cn } from '@/lib/utils';

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  steps: string[];
}

export function StepIndicator({ currentStep, totalSteps, steps }: StepIndicatorProps) {
  return (
    <div className="mb-8">
      <div className="mb-4 flex gap-2">
        {Array.from({ length: totalSteps }).map((_, idx) => (
          <div
            key={idx}
            className={cn(
              'h-2 flex-1 rounded-full transition-colors',
              idx < currentStep
                ? 'bg-indigo-600'
                : idx === currentStep
                  ? 'bg-violet-400'
                  : 'bg-slate-200'
            )}
          />
        ))}
      </div>

      <div className="flex justify-between">
        {steps.map((step, idx) => (
          <div
            key={idx}
            className={cn(
              'flex flex-col items-center gap-1',
              idx <= currentStep ? 'opacity-100' : 'opacity-50'
            )}
          >
            <div
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-2xl text-sm font-semibold transition-colors',
                idx < currentStep
                  ? 'bg-indigo-600 text-white'
                  : idx === currentStep
                    ? 'bg-indigo-50 text-indigo-700 shadow-[inset_0_0_0_1px_rgba(99,102,241,0.2)]'
                    : 'bg-slate-100 text-slate-400 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.18)]'
              )}
            >
              {idx < currentStep ? '✓' : idx + 1}
            </div>
            <p className="max-w-[78px] text-center text-xs text-slate-500">{step}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
