import React from 'react';
import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';

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
  min = 1,
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
      <Button
        type='button'
        variant='outline'
        size="md"
        onClick={handleDecrease}
        disabled={disabled || value <= min}
        className='w-10 h-10 rounded-lg'
      >
        <Minus className="w-4 h-4" />
      </Button>

      <Input
        type="number"
        value={value}
        onChange={handleInputChange}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        className='w-20 px-3 py-2 text-center'
      />

      <Button
        type='button'
        variant='outline'
        size="md"
        onClick={handleIncrease}
        disabled={disabled || value >= max}
        className='w-10 h-10 rounded-lg'
      >
        <Plus className="w-4 h-4" />
      </Button>
    </div>
  );
}
