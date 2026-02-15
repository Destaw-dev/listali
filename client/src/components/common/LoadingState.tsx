'use client';

import { cn } from '../../lib/utils';
import { LoadingSpinner } from './LoadingSpinner';

interface LoadingStateProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'page' | 'section' | 'inline';
  className?: string;
}

export function LoadingState({
  message,
  size = 'md',
  variant = 'page',
  className,
}: LoadingStateProps) {
  const variantClasses = {
    page: 'min-h-screen bg-surface flex items-center justify-center',
    section: 'flex items-center justify-center h-64',
    inline: 'flex items-center justify-center',
  };

  return (
    <div className={cn(variantClasses[variant], className)}>
      <LoadingSpinner message={message} size={size} />
    </div>
  );
}
