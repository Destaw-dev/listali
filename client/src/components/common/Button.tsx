import React from 'react';
import { ButtonProps as IButtonProps } from '../../types';
import { cn } from '@/lib/utils';

interface ButtonProps extends IButtonProps {
  children: React.ReactNode;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  rounded?: boolean;
  shadow?: boolean;
  glow?: boolean;
}

export function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  disabled = false, 
  loading = false,
  onClick,
  type = 'button',
  className = '',
  icon,
  iconPosition = 'left',
  fullWidth = false,
  rounded = false,
  shadow = true,
  glow = false
}: ButtonProps) {
  const baseClasses = cn(
    'inline-flex items-center justify-center font-medium transition-all duration-200',
    // 'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    'active:scale-95 transform',
    fullWidth && 'w-full',
    rounded ? 'rounded-full' : 'rounded-lg',
    shadow && 'shadow-sm hover:shadow-md',
    glow && 'shadow-glow-primary hover:shadow-glow-primary/80',
    className
  );
  
  const variantClasses: Record<string, string> = {
    primary: cn(
      'bg-gradient-to-br from-primaryT-500 to-primaryT-600 text-white',
      'focus:ring-primary shadow-lg hover:shadow-xl'
    ),
    secondary: cn(
      'bg-secondary text-white hover:bg-secondary/90',
      'focus:ring-secondary shadow-lg hover:shadow-xl'
    ),
    accent: cn(
      'bg-accent text-white hover:bg-accent/90',
      'focus:ring-accent shadow-lg hover:shadow-xl'
    ),
    outline: cn(
      'border border-primary text-primary',
      'hover:bg-primary-50 focus:ring-primary',
      'bg-transparent shadow-lg hover:shadow-xl'
    ),
    ghost: cn(
      'text-primary hover:bg-primary-50',
      'focus:ring-primary bg-transparent',
      'shadow-sm hover:shadow-md'
    ),
    destructive: cn(
      'bg-error text-white hover:bg-error/90',
      'focus:ring-error shadow-lg hover:shadow-xl'
    ),
    success: cn(
      'bg-success text-white hover:bg-success/90',
      'focus:ring-success shadow-lg hover:shadow-xl'
    ),
    warning: cn(
      'bg-warning text-white hover:bg-warning/90',
      'focus:ring-warning shadow-lg hover:shadow-xl'
    ),
    error: cn(
      'border border-error text-error',
      'hover:bg-error/5 focus:ring-error',
      'bg-transparent shadow-lg hover:shadow-xl'
    ),
  };
  
  const sizeClasses: Record<string, string> = {
    xs: 'px-2 py-1 text-xs gap-1',
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2',
    xl: 'px-8 py-4 text-lg gap-3'
  };
  
  const classes = cn(
    baseClasses,
    variantClasses[variant],
    sizeClasses[size]
  );
  
  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      onClick={onClick}
    >
      {loading && (
        <svg 
          className="animate-spin h-4 w-4" 
          fill="none" 
          viewBox="0 0 24 24"
        >
          <circle 
            className="opacity-25" 
            cx="12" 
            cy="12" 
            r="10" 
            stroke="currentColor" 
            strokeWidth="4" 
          />
          <path 
            className="opacity-75" 
            fill="currentColor" 
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" 
          />
        </svg>
      )}
      
      {!loading && icon && iconPosition === 'left' && (
        <span className="flex-shrink-0">{icon}</span>
      )}
      
      <span className="flex-shrink-0">{children}</span>
      
      {!loading && icon && iconPosition === 'right' && (
        <span className="flex-shrink-0">{icon}</span>
      )}
    </button>
  );
} 