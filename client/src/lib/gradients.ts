/**
 * Centralized gradient utility for consistent theming across the application
 *
 * Usage:
 * import { gradients } from '@/lib/gradients';
 * <div className={gradients.primary}>...</div>
 */

export const gradients = {
  primary: 'bg-gradient-to-br from-primary-500 to-primary-600',
  secondary: 'bg-gradient-to-br from-secondary-500 to-secondary-700',
  accent: 'bg-gradient-to-br from-accent-500 to-accent-700',
  success: 'bg-gradient-to-br from-success-500 to-success-700',
  warning: 'bg-gradient-to-br from-warning-500 to-warning-700',
  error: 'bg-gradient-to-br from-error-500 to-error-700',
} as const;

export type GradientKey = keyof typeof gradients;

/**
 * Get a gradient by key
 * @param key - The gradient key (primary, secondary, etc.)
 * @returns The gradient class string
 */
export function getGradient(key: GradientKey): string {
  return gradients[key];
}
