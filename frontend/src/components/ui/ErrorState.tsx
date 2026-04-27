import { AlertCircle } from 'lucide-react';
import { Button } from './Button';
import { Reveal } from './Reveal';

export interface ErrorStateProps {
  message?: string;
  description?: string;
  onRetry?: () => void;
}

export function ErrorState({
  message = 'Terjadi kesalahan',
  description = 'Silakan coba lagi nanti',
  onRetry,
}: ErrorStateProps) {
  return (
    <Reveal className="surface-panel flex flex-col items-center justify-center gap-5 border-rose-200 bg-rose-50/80 px-6 py-12 text-center">
      <div className="pulse-glow rounded-full border border-rose-200 bg-white p-4">
        <AlertCircle className="h-10 w-10 text-rose-500" />
      </div>
      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-slate-950">{message}</h3>
        <p className="text-sm text-slate-600">{description}</p>
      </div>
      {onRetry && (
        <Button size="sm" variant="secondary" onClick={onRetry}>
          Coba Lagi
        </Button>
      )}
    </Reveal>
  );
}
