/**
 * Centralized icon size constants for consistent icon sizing across the application
 *
 * Usage:
 * import { iconSizes } from '@/lib/iconSizes';
 * <Icon className={iconSizes.md} />
 */

export const iconSizes = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8',
  '2xl': 'w-10 h-10',
} as const;

export type IconSize = keyof typeof iconSizes;

/**
 * Get an icon size by key
 * @param size - The size key (xs, sm, md, lg, xl, 2xl)
 * @returns The icon size class string
 */
export function getIconSize(size: IconSize): string {
  return iconSizes[size];
}
