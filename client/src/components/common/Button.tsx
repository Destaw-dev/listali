import React from 'react';
import { ButtonProps as IButtonProps } from '../../types';
import { cn } from '@/lib/utils';

interface ButtonProps extends Omit<IButtonProps, 'variant'> {
  children?: React.ReactNode;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  rounded?: boolean;
  shadow?: boolean;
  glow?: boolean;
  checked?: boolean; 
  checkIcon?: React.ReactNode; 
  variant?: IButtonProps['variant'] | 'checkbox'; 
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
  glow = false,
  checked = false,
  checkIcon
}: ButtonProps) {
  const baseClasses = cn(
    'inline-flex items-center justify-center font-medium transition-all duration-200',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    'active:scale-95 transform',
    fullWidth && 'w-full',
    rounded ? 'rounded-full' : 'rounded-md',
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
    outlineBlue: cn(
      'border border-primary text-primary',
      'hover:bg-primary-50 focus:ring-primary',
      'bg-transparent shadow-lg hover:shadow-xl'
    ),
    outline: cn(
      'border border-border text-text-primary',
      'hover:bg-surface-hover focus:ring-primary',
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
    checkbox: cn(
      'flex items-center justify-center rounded-full border-2 transition-all',
      'size-6 shrink-0',
      checked
        ? 'bg-emerald-500 border-emerald-500 text-white'
        : 'border-slate-200 bg-white hover:border-slate-300'
    ),
  };
  
  const sizeClasses: Record<string, string> = {
    xs: 'px-2 py-1 text-xs gap-1',
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2',
    xl: 'px-8 py-4 text-lg gap-3'
  };
  
  const isCheckbox = variant === 'checkbox';
  const checkboxSizeClasses: Record<string, string> = {
    xs: 'size-4',
    sm: 'size-5',
    md: 'size-6',
    lg: 'size-7',
    xl: 'size-8'
  };
  
  const classes = cn(
    baseClasses,
    variantClasses[variant],
    isCheckbox ? checkboxSizeClasses[size] : sizeClasses[size],
    isCheckbox && 'shadow-none hover:shadow-none'
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
      
      {isCheckbox && checked && (
        <span className="flex-shrink-0">
          {checkIcon || (
            <svg 
              className="h-3.5 w-3.5 stroke-[3px]" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </span>
      )}
      
      {!isCheckbox && (
        <>
          {!loading && icon && iconPosition === 'left' && (
            <span className="flex-shrink-0">{icon}</span>
          )}
          
          {children && <span className="flex-shrink-0">{children}</span>}
          
          {!loading && icon && iconPosition === 'right' && (
            <span className="flex-shrink-0">{icon}</span>
          )}
        </>
      )}
    </button>
  );
} 