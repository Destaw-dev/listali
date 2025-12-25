import { useEffect } from 'react';

/**
 * Hook to prevent body scroll when a modal is open
 * @param isOpen - Whether the modal is open
 */
export function useModalScrollLock(isOpen: boolean) {
  useEffect(() => {
    if (isOpen) {
      // Save current overflow style
      const originalStyle = window.getComputedStyle(document.body).overflow;
      // Disable body scroll
      document.body.style.overflow = 'hidden';
      // Restore on cleanup
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);
}

