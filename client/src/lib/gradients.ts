/**
 * Centralized gradient utility for consistent theming across the application
 *
 * Usage:
 * import { gradients } from '@/lib/gradients';
 * <div className={gradients.primary}>...</div>
 */

export const gradients = {
  primary: 'bg-gradient-to-br from-primary-400 to-primary-600',
  secondary: 'bg-gradient-to-br from-secondary-400 to-secondary-600',
  accent: 'bg-gradient-to-br from-accent-400 to-accent-600',
  success: 'bg-gradient-to-br from-success-400 to-success-600',
  warning: 'bg-gradient-to-br from-warning-400 to-warning-600',
  error: 'bg-gradient-to-br from-error-400 to-error-600',
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
