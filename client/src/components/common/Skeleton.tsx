import React from 'react';
import { cn } from '../../lib/utils';

interface SkeletonProps {
  /**
   * Visual variant of the skeleton
   * @default 'line'
   */
  variant?: 'line' | 'circle' | 'rectangle' | 'card';

  /**
   * Width class (e.g., 'w-full', 'w-48')
   * @default 'w-full'
   */
  width?: string;

  /**
   * Height class (e.g., 'h-4', 'h-48')
   * @default 'h-4'
   */
  height?: string;

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Whether to animate the skeleton
   * @default true
   */
  animate?: boolean;

  /**
   * Optional accessible label for screen readers.
   * If omitted, skeleton is hidden from screen readers.
   */
  ariaLabel?: string;
}

/**
 * Skeleton component for loading states
 *
 * @example
 * ```tsx
 * <Skeleton variant="line" width="w-3/4" height="h-6" />
 * <Skeleton variant="circle" width="w-12" height="h-12" />
 * <SkeletonCard />
 * ```
 */
export function Skeleton({
  variant = 'line',
  width = 'w-full',
  height = 'h-4',
  className = '',
  animate = true,
  ariaLabel,
}: SkeletonProps) {
  const baseClasses = 'bg-surface-hover';
  const animateClasses = animate ? 'animate-pulse' : '';

  const variantClasses = {
    line: `${height} ${width} rounded`,
    circle: `${width} ${height} rounded-full`,
    rectangle: `${height} ${width} rounded-lg`,
    card: 'h-48 w-full rounded-lg',
  };

  return (
    <div
      className={cn(
        baseClasses,
        animateClasses,
        variantClasses[variant],
        className
      )}
      aria-label={ariaLabel}
      role={ariaLabel ? 'status' : undefined}
      aria-live={ariaLabel ? 'polite' : undefined}
      aria-hidden={ariaLabel ? undefined : true}
    />
  );
}

/**
 * Pre-composed skeleton pattern for card loading states
 *
 * @example
 * ```tsx
 * {isLoading ? <SkeletonCard /> : <Card>...</Card>}
 * ```
 */
export function SkeletonCard() {
  return (
    <div className="p-4 sm:p-6 border border-border rounded-lg space-y-3 bg-surface">
      <Skeleton variant="line" height="h-6" width="w-3/4" />
      <Skeleton variant="line" height="h-4" width="w-full" />
      <Skeleton variant="line" height="h-4" width="w-5/6" />
    </div>
  );
}

/**
 * Pre-composed skeleton pattern for list item loading
 */
export function SkeletonListItem() {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-surface">
      <Skeleton variant="circle" width="w-10" height="h-10" />
      <div className="flex-1 space-y-2">
        <Skeleton variant="line" height="h-5" width="w-2/3" />
        <Skeleton variant="line" height="h-4" width="w-1/2" />
      </div>
    </div>
  );
}

/**
 * Pre-composed skeleton pattern for avatar
 */
export function SkeletonAvatar({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
  };

  return (
    <Skeleton
      variant="circle"
      width={sizeClasses[size]}
      height={sizeClasses[size]}
    />
  );
}

/**
 * Pre-composed skeleton pattern for text blocks
 */
export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="line"
          height="h-4"
          width={i === lines - 1 ? 'w-4/5' : 'w-full'}
        />
      ))}
    </div>
  );
}
