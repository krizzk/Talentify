import { Inbox } from 'lucide-react';
import { Button } from './Button';
import { Reveal } from './Reveal';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({
  icon = <Inbox className="h-16 w-16 text-indigo-500" />,
  title = 'Tidak ada data',
  description = 'Mulai dengan membuat yang baru',
  action,
}: EmptyStateProps) {
  return (
    <Reveal className="surface-panel faint-grid flex flex-col items-center justify-center gap-5 border-dashed border-slate-200 px-6 py-12 text-center">
      <div className="float-orbit rounded-full border border-slate-200 bg-white p-4 shadow-[0_16px_30px_rgba(15,23,42,0.08)]">
        {icon}
      </div>
      <div>
        <h3 className="mb-1 text-lg font-semibold text-slate-950">{title}</h3>
        <p className="text-sm text-slate-600">{description}</p>
      </div>
      {action && (
        <Button size="sm" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </Reveal>
  );
}
