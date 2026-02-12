/**
 * Centralized typography system for consistent text styling across the application
 *
 * Usage:
 * import { typography } from '@/lib/typography';
 * <h1 className={typography.h1}>Heading</h1>
 */

export const typography = {
  h1: 'text-4xl font-bold tracking-tight',
  h2: 'text-3xl font-semibold tracking-tight',
  h3: 'text-2xl font-semibold',
  h4: 'text-xl font-semibold',
  h5: 'text-lg font-semibold',
  h6: 'text-base font-semibold',
  body: 'text-base',
  bodyLarge: 'text-lg',
  bodySmall: 'text-sm',
  caption: 'text-xs',
  label: 'text-sm font-medium',
  labelLarge: 'text-base font-medium',
} as const;

export type TypographyKey = keyof typeof typography;

/**
 * Get a typography style by key
 * @param key - The typography key (h1, h2, body, etc.)
 * @returns The typography class string
 */
export function getTypography(key: TypographyKey): string {
  return typography[key];
}
