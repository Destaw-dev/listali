'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from './Button';

export interface MenuOption {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
  disabled?: boolean;
  variant?: 'default' | 'danger' | 'ghost' | 'outline' | 'surface' | 'primary';
}

interface MenuButtonProps {
  options: MenuOption[];
  size?: 'sm' | 'md' | 'lg';
  variant?: 'ghost' | 'outline' | 'surface' | 'primary';
  align?: 'start' | 'end' | 'center';
  position?: 'bottom' | 'top';
  className?: string;
  menuClassName?: string;
  triggerClassName?: string;
  disabled?: boolean;
}

export function MenuButton({
  options,
  size = 'md',
  variant = 'ghost',
  align = 'end',
  position = 'bottom',
  className,
  menuClassName,
  triggerClassName,
  disabled = false,
}: MenuButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        buttonRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleOptionClick = (option: MenuOption) => {
    if (option.disabled) return;
    option.onClick();
    setIsOpen(false);
  };


  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const alignClasses = {
    start: 'left-0',
    end: 'right-0',
    center: 'left-1/2 -translate-x-1/2',
  };

  const positionClasses = {
    bottom: 'top-full mt-1',
    top: 'bottom-full mb-1',
  };

  return (
    <div className={cn('relative', className)}>
      <div ref={buttonRef}>
        <Button
          variant={variant}
          size={size}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={cn(triggerClassName)}
          rounded
        >
          <MoreVertical className={iconSizes[size]} />
        </Button>
      </div>

      {isOpen && (
        <div
          ref={menuRef}
          className={cn(
            'absolute z-50 min-w-[160px]',
            alignClasses[align],
            positionClasses[position],
            'bg-card border border-border rounded-lg shadow-xl overflow-hidden',
            'animate-fade-in',
            menuClassName
          )}
        >
          {options.map((option, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleOptionClick(option)}
              disabled={option.disabled}
              className={cn(
                'w-full flex items-center gap-2 px-3 py-2 text-sm',
                'focus:outline-none focus:bg-background-hover',
                option.disabled
                  ? 'opacity-50 cursor-not-allowed text-muted'
                  : option.variant === 'danger'
                  ? 'text-error-600 hover:bg-error-50 cursor-pointer'
                  : 'text-primary-700 hover:bg-background-50 cursor-pointer'
              )}
            >
              {option.icon && (
                <span className="flex-shrink-0">{option.icon}</span>
              )}
              <span className="flex-1 text-start">{option.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

