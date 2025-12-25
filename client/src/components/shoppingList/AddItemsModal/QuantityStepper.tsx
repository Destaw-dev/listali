import React from 'react';
import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuantityStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  className?: string;
}

export function QuantityStepper({
  value,
  onChange,
  min = 0.1,
  max = 10000,
  step = 1,
  disabled = false,
  className,
}: QuantityStepperProps) {
  const handleDecrease = () => {
    const newValue = Math.max(min, value - step);
    onChange(newValue);
  };

  const handleIncrease = () => {
    const newValue = Math.min(max, value + step);
    onChange(newValue);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = parseFloat(e.target.value);
    if (!isNaN(inputValue)) {
      const clampedValue = Math.max(min, Math.min(max, inputValue));
      onChange(clampedValue);
    }
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <button
        type="button"
        onClick={handleDecrease}
        disabled={disabled || value <= min}
        className={cn(
          'flex items-center justify-center w-10 h-10 rounded-lg',
          'border-2 border-primary text-primary',
          'hover:bg-primary hover:text-white',
          'transition-all duration-200',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-primary',
          'active:scale-95'
        )}
      >
        <Minus className="w-4 h-4" />
      </button>

      <input
        type="number"
        value={value}
        onChange={handleInputChange}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        className={cn(
          'w-20 px-3 py-2 text-center',
          'border-2 border-border rounded-lg',
          'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
          'text-text-secondary font-medium',
          'disabled:opacity-50 disabled:cursor-not-allowed'
        )}
      />

      <button
        type="button"
        onClick={handleIncrease}
        disabled={disabled || value >= max}
        className={cn(
          'flex items-center justify-center w-10 h-10 rounded-lg',
          'border-2 border-primary text-primary',
          'hover:bg-primary hover:text-white',
          'transition-all duration-200',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-primary',
          'active:scale-95'
        )}
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}
