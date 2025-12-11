import React from 'react';
import { cn } from '@/lib/utils';

// --- Badge Component ---

// Extend standard span props and omit properties we explicitly handle
interface BaseBadgeProps extends React.ComponentPropsWithoutRef<'span'> {
  variant?: 'default' | 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md' | 'lg';
  rounded?: boolean;
  dot?: boolean;
  onClick?: () => void;
}

export interface BadgeProps extends BaseBadgeProps {
  children: React.ReactNode;
}

export function Badge({ 
  children, 
  variant = 'default',
  size = 'md',
  rounded = false,
  dot = false,
  className,
  onClick ,
  ...rest // Capture remaining standard HTML props
}: BadgeProps) {
  
  // Accessibility: Conditional props for interactive badges
  const interactiveProps = onClick ? { 
    role: 'button', 
    tabIndex: 0, 
    onKeyDown: (e: React.KeyboardEvent<HTMLSpanElement>) => {
      if (onClick && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        // No error now because onClick is defined as () => void
        onClick(); 
      }
    }
  } : {};

  const baseClasses = cn(
    'inline-flex items-center font-medium transition-all duration-200',
    // Added focus ring for accessibility
    'focus:outline-none focus:ring-2 focus:ring-offset-2', 
    // Added active state for better UI feedback
    onClick && 'cursor-pointer hover:scale-105 active:scale-100', 
    rounded ? 'rounded-full' : 'rounded-lg',
    className
  );

  const variantClasses = {
    default: cn(
      'bg-neutral-100 text-neutral-800 focus:ring-neutral-500',
      'hover:bg-neutral-200'
    ),
    primary: cn(
      'bg-primaryT-500 text-white focus:ring-primary-500',
      'hover:bg-primaryT-600'
    ),
    secondary: cn(
      'bg-secondaryT-500 text-white focus:ring-secondary-500',
      'hover:bg-secondaryT-600'
    ),
    accent: cn(
      'bg-accentT-500 text-white focus:ring-accent-500',
      'hover:bg-accentT-600'
    ),
    // Status/Alert variants use lighter backgrounds and borders
    success: cn(
      'bg-success text-white focus:ring-success',
      'hover:bg-success'
    ),
    warning: cn(
      'bg-warning-500 text-white focus:ring-warning',
      'hover:bg-warning-600'
    ),
    error: cn(
      'bg-error text-white focus:ring-error',
      'hover:bg-error'
    ),
    info: cn(
      'bg-info-500 text-white focus:ring-info',
      'hover:bg-info-600'
    )
  };

  const sizeClasses = {
    sm: cn(
      'px-2 py-0.5 text-xs gap-1',
      dot && 'pl-1.5'
    ),
    md: cn(
      'px-2.5 py-1 text-sm gap-1.5',
      dot && 'pl-2'
    ),
    lg: cn(
      'px-3 py-1.5 text-base gap-2',
      dot && 'pl-2.5'
    )
  };

  const dotClasses = cn(
    'w-1.5 h-1.5 rounded-full shrink-0', // Added shrink-0 to prevent dot from compressing
    variant === 'default' && 'bg-neutral-500',
    variant === 'primary' && 'bg-primary-500',
    variant === 'secondary' && 'bg-secondary-500',
    variant === 'accent' && 'bg-accent-500',
    variant === 'success' && 'bg-success',
    variant === 'warning' && 'bg-warning',
    variant === 'error' && 'bg-error',
    variant === 'info' && 'bg-info'
  );

  const classes = cn(
    baseClasses,
    variantClasses[variant],
    sizeClasses[size]
  );

  return (
    <span 
      className={classes} 
      onClick={onClick}
      {...interactiveProps}
      {...rest} // Spread remaining standard HTML props
    >
      {dot && <span className={dotClasses} />}
      {children}
    </span>
  );
}

// --- Notification Badge Component (Wrapper) ---

interface NotificationBadgeProps extends React.ComponentPropsWithoutRef<'span'> {
  count?: number;
  maxCount?: number;
  showZero?: boolean;
  variant?: 'primary' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode; // The element it wraps (e.g., an icon, button)
}

/**
 * Renders a count badge positioned absolutely over a wrapped element (children).
 */
export function NotificationBadge({ 
  count = 0,
  maxCount = 99,
  showZero = false,
  variant = 'error',
  size = 'md',
  children,
  className,
  ...rest
}: NotificationBadgeProps) {
  if (count === 0 && !showZero) {
    return <>{children}</>;
  }

  const displayCount = count > maxCount ? `${maxCount}+` : count.toString();

  const sizeClasses = {
    sm: 'min-w-[16px] h-4 px-1 text-xs',
    md: 'min-w-[20px] h-5 px-1.5 text-xs',
    lg: 'min-w-[24px] h-6 px-2 text-sm'
  };

  // Use solid background variants for notifications
  const variantClasses = {
      primary: 'bg-primary-500', 
      success: 'bg-success',
      warning: 'bg-warning-500',
      error: 'bg-error',
  };

  const notificationClasses = cn(
    // Positioning relative to the wrapper
    'absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2',
    // Base styles
    'inline-flex items-center justify-center rounded-full font-bold text-white z-10 whitespace-nowrap',
    sizeClasses[size],
    variantClasses[variant],
    className
  );
  
  // Wrapper needs 'relative inline-flex' to position the badge correctly
  return (
    <span className="relative inline-flex" {...rest}>
      {children}
      <span className={notificationClasses}>
        {displayCount}
      </span>
    </span>
  );
}

// --- Status Badge Component (Composed) ---

interface StatusBadgeProps {
  status: 'online' | 'offline' | 'away' | 'busy' | 'pending' | 'approved' | 'rejected';
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

/**
 * Composed component that uses the base Badge to display common status indicators.
 */
export function StatusBadge({ 
  status,
  size = 'md',
  showText = false,
  className
}: StatusBadgeProps) {
  const statusConfig = {
    online: { color: 'success', text: 'Online' },
    offline: { color: 'neutral', text: 'Offline' },
    away: { color: 'warning', text: 'Away' },
    busy: { color: 'error', text: 'Busy' },
    pending: { color: 'warning', text: 'Pending' },
    approved: { color: 'success', text: 'Approved' },
    rejected: { color: 'error', text: 'Rejected' }
  };

  const config = statusConfig[status];
  // Map 'neutral' color to the 'default' variant of the base Badge
  const variant = config.color === 'neutral' ? 'default' : config.color;

  return (
    <Badge 
      variant={variant as BadgeProps['variant']} // Type cast for derived variant
      size={size}
      dot
      className={className}
    >
      {/* Conditionally render the status text */}
      {showText && config.text}
    </Badge>
  );
}