import React from 'react';
import { cn } from '../../lib/utils';

interface BaseBadgeProps extends React.ComponentPropsWithoutRef<'span'> {

  variant?: 'default' | 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'error' | 'info' | 'priority';
  size?: 'xs' | 'sm' | 'md' | 'lg';
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
  onClick,
  ...rest 
}: BadgeProps) {
  
  const interactiveProps = onClick ? { 
    role: 'button', 
    tabIndex: 0, 
    onKeyDown: (e: React.KeyboardEvent<HTMLSpanElement>) => {
      if (onClick && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        onClick(); 
      }
    }
  } : {};

  const baseClasses = cn(
    'inline-flex items-center font-medium transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-offset-2', 
    onClick && 'cursor-pointer hover:scale-105 active:scale-100', 
    rounded ? 'rounded-full' : 'rounded-lg',
    className
  );

  const variantClasses = {
    default: 'bg-neutral-100 text-neutral-800 focus:ring-neutral-500 hover:bg-neutral-200',
    primary: 'bg-background-500 text-text-primary focus:ring-primary-500 hover:bg-background-600',
    secondary: 'bg-secondary-500 text-text-primary focus:ring-secondary-500 hover:bg-secondary-600',
    accent: 'bg-accent-500 text-text-primary focus:ring-accent-500 hover:bg-accent-600',
    success: 'bg-success text-text-primary focus:ring-success hover:bg-success',
    warning: 'bg-warning-500 text-text-primary focus:ring-warning hover:bg-warning-600',
    error: 'bg-error text-text-primary focus:ring-error hover:bg-error',
    info: 'bg-info-500 text-text-primary focus:ring-info hover:bg-info-600',
    priority: 'bg-error-500 text-text-primary focus:ring-error hover:bg-error-600'
  };

  const sizeClasses = {
    
    xs: cn('px-1.5 py-0.5 text-[10px] gap-1', dot && 'pl-1'),
    sm: cn('px-2 py-0.5 text-[10px] gap-1', dot && 'pl-1.5'),
    md: cn('px-2.5 py-1 text-sm gap-1.5', dot && 'pl-2'),
    lg: cn('px-3 py-1.5 text-base gap-2', dot && 'pl-2.5')
  };

  const dotClasses = cn(
    'w-1.5 h-1.5 rounded-full shrink-0',
    variant === 'default' && 'bg-neutral-500',
    variant === 'primary' && 'bg-background-500',
    variant === 'secondary' && 'bg-secondary-500',
    variant === 'accent' && 'bg-accent-500',
    variant === 'success' && 'bg-success-600',
    variant === 'warning' && 'bg-warning',
    variant === 'error' && 'bg-error',
    variant === 'info' && 'bg-info',
    variant === 'priority' && 'bg-slate-400'
  );

  return (
    <span 
      className={cn(baseClasses, variantClasses[variant], sizeClasses[size])} 
      onClick={onClick}
      {...interactiveProps}
      {...rest}
    >
      {dot && <span className={dotClasses} />}
      {children}
    </span>
  );
}


interface NotificationBadgeProps extends React.ComponentPropsWithoutRef<'span'> {
  count?: number;
  maxCount?: number;
  showZero?: boolean;
  variant?: 'primary' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode; 
}

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

  const variantClasses = {
      primary: 'bg-background-500', 
      success: 'bg-success',
      warning: 'bg-warning-500',
      error: 'bg-error',
  };

  const notificationClasses = cn(
    'absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2',
    'inline-flex items-center justify-center rounded-full font-bold text-text-primary z-10 whitespace-nowrap',
    sizeClasses[size],
    variantClasses[variant],
    className
  );
  
  return (
    <span className="relative inline-flex" {...rest}>
      {children}
      <span className={notificationClasses}>
        {displayCount}
      </span>
    </span>
  );
}

interface StatusBadgeProps {
  status: 'online' | 'offline' | 'away' | 'busy' | 'pending' | 'approved' | 'rejected';
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

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
  const variant = config.color === 'neutral' ? 'default' : config.color;

  return (
    <Badge 
      variant={variant as BadgeProps['variant']} 
      size={size}
      dot
      className={className}
    >
      {showText && config.text}
    </Badge>
  );
}