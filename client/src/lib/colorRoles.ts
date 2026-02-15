/**
 * Color role policy used across app pages/components.
 * Keep visual hierarchy predictable:
 * - primary: main CTA and key brand emphasis
 * - secondary: secondary actions and supporting highlights
 * - accent: helper highlights, never dominant over primary CTA
 * - success/warning/error/info: status and feedback only
 */
export const colorRoleClasses = {
  ctaPrimary: 'from-primary-500 to-primary-600',
  ctaSecondary: 'from-secondary-500 to-secondary-600',
  emphasis: 'from-primary-500 to-accent-500',
  statusSuccessSoft: 'bg-[var(--color-status-success-soft)]',
  statusWarningSoft: 'bg-[var(--color-status-warning-soft)]',
  statusErrorSoft: 'bg-[var(--color-status-error-soft)]',
  statusSecondarySoft: 'bg-[var(--color-status-secondary-soft)]',
} as const;

export type ColorRoleClassKey = keyof typeof colorRoleClasses;
