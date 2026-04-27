import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-xl border font-semibold tracking-[-0.01em] transition duration-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/10 disabled:pointer-events-none disabled:opacity-60',
  {
    variants: {
      variant: {
        primary:
          'border-transparent bg-indigo-600 text-white shadow-[0_18px_35px_rgba(79,70,229,0.22)] hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-[0_22px_42px_rgba(79,70,229,0.28)]',
        secondary:
          'border-slate-200 bg-white text-slate-700 shadow-[0_12px_28px_rgba(15,23,42,0.08)] hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700',
        ghost:
          'border-transparent bg-transparent text-slate-500 hover:-translate-y-0.5 hover:bg-indigo-50 hover:text-indigo-700',
        danger:
          'border-rose-300/80 bg-[linear-gradient(135deg,#ef4444,#dc2626)] text-white shadow-[0_18px_35px_rgba(220,38,38,0.22)] hover:-translate-y-0.5 hover:shadow-[0_24px_45px_rgba(220,38,38,0.28)]',
      },
      size: {
        sm: 'h-10 px-4 text-sm',
        md: 'h-11 px-5 text-sm sm:text-[15px]',
        lg: 'h-12 px-7 text-base',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
}

export function Button({
  className,
  variant,
  size,
  isLoading,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading && (
        <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}
