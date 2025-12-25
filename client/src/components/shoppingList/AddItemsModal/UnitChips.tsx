import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface UnitChipsProps {
  value: string;
  onChange: (value: string) => void;
  units: string[];
  disabled?: boolean;
  className?: string;
  t: (key: string) => string;
}

// Mapping from English unit keys to translation keys
const unitLabels: Record<string, string> = {
  piece: 'unitPiece',
  kg: 'unitKg',
  g: 'unitG',
  l: 'unitL',
  ml: 'unitMl',
  package: 'unitPackage',
  box: 'unitBox',
  bag: 'unitBag',
  bottle: 'unitBottle',
  can: 'unitCan',
};

// Reverse mapping from Hebrew/translated unit names to English keys
// This helps normalize units that come in as Hebrew text
const hebrewToEnglish: Record<string, string> = {
  // Hebrew translations
  'יחידה': 'piece',
  'יחידות': 'piece',
  'ק"ג': 'kg',
  'קילוגרם': 'kg',
  'גרם': 'g',
  'ליטר': 'l',
  'מ"ל': 'ml',
  'מיליליטר': 'ml',
  'אריזה': 'package',
  'אריזות': 'package',
  'קופסה': 'box',
  'קופסאות': 'box',
  'שקית': 'bag',
  'שקיות': 'bag',
  'בקבוק': 'bottle',
  'בקבוקים': 'bottle',
  'קופסת שימורים': 'can',
  'שימורים': 'can',
  // English translations (in case they're already translated)
  'Piece': 'piece',
  'kg': 'kg',
  'g': 'g',
  'L': 'l',
  'ml': 'ml',
  'Package': 'package',
  'Box': 'box',
  'Bag': 'bag',
  'Bottle': 'bottle',
  'Can': 'can',
};

// Normalize a unit value to its English key
function normalizeUnit(unit: string): string {
  // If it's already an English key, return it
  if (unitLabels[unit]) {
    return unit;
  }
  // Try to find it in the Hebrew mapping
  if (hebrewToEnglish[unit]) {
    return hebrewToEnglish[unit];
  }
  // Try case-insensitive lookup
  const lowerUnit = unit.toLowerCase();
  if (unitLabels[lowerUnit]) {
    return lowerUnit;
  }
  // If no match found, return the original (will fallback to displaying as-is)
  return unit;
}

export function UnitChips({
  value,
  onChange,
  units,
  disabled = false,
  className,
  t,
}: UnitChipsProps) {
  // Default units in English keys
  const defaultUnits = ['piece', 'kg', 'g', 'l', 'ml', 'package', 'box', 'bag', 'bottle', 'can'];
  
  // Normalize all units to English keys
  const normalizedUnits = useMemo(() => {
    if (units.length > 0) {
      return units.map(normalizeUnit);
    }
    return defaultUnits;
  }, [units]);

  // Normalize the current value
  const normalizedValue = useMemo(() => normalizeUnit(value), [value]);

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {normalizedUnits.map((unit) => {
        const isSelected = normalizedValue === unit;
        const labelKey = unitLabels[unit];
        let label: string;
        
        if (labelKey) {
          try {
            // Try to translate the unit
            label = t(labelKey);
            // If translation returns the key itself or includes namespace (meaning it wasn't found), fallback to unit
            if (label === labelKey || label.includes('.')) {
              label = unit;
            }
          } catch (error) {
            // Fallback to unit name if translation fails
            label = unit;
          }
        } else {
          // No translation key found, use unit as-is
          label = unit;
        }

        return (
          <button
            key={unit}
            type="button"
            onClick={() => !disabled && onChange(unit)}
            disabled={disabled}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm font-medium',
              'transition-all duration-200',
              'border-2',
              isSelected
                ? 'bg-primary text-white border-primary shadow-md'
                : 'bg-surface border-border text-text-secondary hover:border-primary/50 hover:bg-primary/5',
              disabled && 'opacity-50 cursor-not-allowed',
              'active:scale-95'
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
