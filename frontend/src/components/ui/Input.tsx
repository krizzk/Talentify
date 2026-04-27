import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export function Input({
  label,
  error,
  helperText,
  className,
  id,
  ...props
}: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="w-full space-y-2">
      {label && (
        <label htmlFor={inputId} className="field-label">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={cn(
          'field-input',
          error && 'border-rose-400/60 bg-rose-500/10 focus:border-rose-400 focus:ring-rose-500/10',
          className
        )}
        {...props}
      />
      {error && <p className="field-error">{error}</p>}
      {helperText && !error && <p className="field-help">{helperText}</p>}
    </div>
  );
}
