import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'outlined' | 'glass';
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  border?: boolean;
  borderTopColor?: string;
  onClick?: () => void;
}

export function Card({ 
  children, 
  className,
  variant = 'default',
  hover = false,
  padding = 'md',
  rounded = 'lg',
  shadow = 'sm',
  borderTopColor = '',
  onClick
}: CardProps) {
  const baseClasses = cn(
    'transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-primary-500',
    onClick && 'cursor-pointer',
    className
  );

  const variantClasses = {
    default: cn(
      'bg-card text-text-primary',
      'shadow-lg'
    ),
    elevated: cn(
      'bg-card text-text-primary',
      'shadow-xl hover:shadow-2xl'
    ),
    outlined: cn(
      'bg-transparent text-text-primary',
      'shadow-lg border border-border/30'
    ),
    glass: cn(
      'bg-card/80 text-text-primary',
      'shadow-xl'
    )
  };

  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
    xl: 'p-8'
  };

  const roundedClasses = {
    sm: 'rounded-md',
    md: 'rounded-lg',
    lg: 'rounded-xl',
    xl: 'rounded-2xl',
    full: 'rounded-full'
  };

  const shadowClasses = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl'
  };

  const hoverClasses = hover ? cn(
    'hover:scale-[1.02] hover:shadow-xl',
    'hover:bg-card/95'
  ) : '';

  const borderTopClasses = cn(
    'border-t',
    borderTopColor ? `${borderTopColor}` : ''
  );
  const classes = cn(
    baseClasses,
    variantClasses[variant],
    paddingClasses[padding],
    roundedClasses[rounded],
    shadowClasses[shadow],
    hoverClasses,
    borderTopColor ? borderTopClasses : ''
  );


  return (
    <div className={classes} onClick={onClick}>
      {children}
    </div>
  );
}

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function CardHeader({ 
  children, 
  className,
  padding = 'md'
}: CardHeaderProps) {
  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6'
  };

  return (
    <div className={cn(
      'border-b border-border/20',
      paddingClasses[padding],
      className
    )}>
      {children}
    </div>
  );
}

interface CardBodyProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
}

export function CardBody({ 
  children, 
  className,
  padding = 'md'
}: CardBodyProps) {
  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
    xl: 'p-8'
  };

  return (
    <div className={cn(
      paddingClasses[padding],
      className
    )}>
      {children}
    </div>
  );
}

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function CardFooter({ 
  children, 
  className,
  padding = 'md'
}: CardFooterProps) {
  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6'
  };

  return (
    <div className={cn(
      'border-t border-border/20',
      paddingClasses[padding],
      className
    )}>
      {children}
    </div>
  );
}
