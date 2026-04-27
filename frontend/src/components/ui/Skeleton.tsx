import { cn } from '@/lib/utils';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  count?: number;
}

export function Skeleton({ className, count = 1, ...props }: SkeletonProps) {
  return (
    <div className="space-y-3" {...props}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'h-4 w-full animate-pulse rounded-full bg-[linear-gradient(90deg,rgba(255,255,255,0.06),rgba(255,255,255,0.14),rgba(255,255,255,0.06))]',
            className
          )}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ count = 3 }: SkeletonProps) {
  return (
    <div className="surface-panel space-y-3 p-5">
      <div className="h-5 w-1/3 animate-pulse rounded-full bg-[linear-gradient(90deg,rgba(255,255,255,0.06),rgba(255,255,255,0.14),rgba(255,255,255,0.06))]" />
      <Skeleton count={count} />
    </div>
  );
}

export function SkeletonLine() {
  return <div className="h-4 w-full animate-pulse rounded-full bg-[linear-gradient(90deg,rgba(255,255,255,0.06),rgba(255,255,255,0.14),rgba(255,255,255,0.06))]" />;
}
