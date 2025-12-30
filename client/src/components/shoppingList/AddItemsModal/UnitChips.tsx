import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/common/Button';
import { normalizeUnit, unitLabels } from '@/lib/utils';

interface UnitChipsProps {
  value: string;
  onChange: (value: string) => void;
  units: string[];
  disabled?: boolean;
  className?: string;
  t: (key: string) => string;
}


export function UnitChips({
  value,
  onChange,
  units,
  disabled = false,
  className,
  t,
}: UnitChipsProps) {
  
  const normalizedUnits = useMemo(() => {
    const defaultUnits = ['piece', 'kg', 'g', 'l', 'ml', 'package', 'box', 'bag', 'bottle', 'can'];
    if (units.length > 0) {
      return units.map(normalizeUnit);
    }
    return defaultUnits;
  }, [units]);

  const normalizedValue = useMemo(() => normalizeUnit(value), [value]);

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {normalizedUnits.map((unit) => {
        const isSelected = normalizedValue === unit;
        const labelKey = unitLabels[unit];
        let label: string;
        
        if (labelKey) {
          try {
            label = t(labelKey);
            if (label === labelKey || label.includes('.')) {
              label = unit;
            }
          } catch {
            label = unit;
          }
        } else {
          label = unit;
        }

        return (
          <Button
            key={unit}
            type='button'
            variant={isSelected ? 'primary' : 'outline'}
            size='sm'
            onClick={() => !disabled && onChange(unit)}
            disabled={disabled}    
            rounded
          >
            {label}
          </Button>
        );
      })}
    </div>
  );
}
