'use client';

import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface RevealProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  delay?: number;
  variant?: 'up' | 'soft';
}

export function Reveal({
  children,
  className,
  delay = 0,
  style,
  variant = 'up',
  ...props
}: RevealProps) {
  const revealStyle: CSSProperties = {
    animationDelay: `${delay}ms`,
    ...style,
  };

  return (
    <div
      className={cn(
        variant === 'soft' ? 'animate-enter-soft' : 'animate-enter',
        className
      )}
      style={revealStyle}
      {...props}
    >
      {children}
    </div>
  );
}
