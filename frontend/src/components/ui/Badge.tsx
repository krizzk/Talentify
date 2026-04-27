import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold tracking-[0.01em] backdrop-blur transition duration-300',
  {
    variants: {
      variant: {
        matched: 'border-emerald-200 bg-emerald-50 text-emerald-700',
        missing: 'border-rose-200 bg-rose-50 text-rose-700',
        neutral: 'border-slate-200 bg-slate-50 text-slate-600',
        blue: 'border-blue-200 bg-blue-50 text-blue-700',
        purple: 'border-violet-200 bg-violet-50 text-violet-700',
        amber: 'border-amber-200 bg-amber-50 text-amber-700',
      },
    },
    defaultVariants: {
      variant: 'neutral',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}
