/**
 * Hook for monitoring localStorage usage and warning when space is low
 */

import { useEffect, useState, useCallback } from 'react';
import { GUEST_LIMITS } from '../constants/guestLimits';

interface StorageInfo {
  used: number;
  available: number;
  total: number;
  percentageUsed: number;
  shouldWarn: boolean;
}

/**
 * Estimate localStorage size in bytes
 * Note: This is an approximation as browsers don't provide exact storage size
 */
function estimateStorageSize(): number {
  let total = 0;
  for (const key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      const value = localStorage.getItem(key);
      if (value) {
        // Each character is roughly 2 bytes (UTF-16)
        total += key.length * 2 + value.length * 2;
      }
    }
  }
  return total;
}

/**
 * Get storage quota (approximate)
 * Most browsers allow ~5-10MB for localStorage
 */
function getStorageQuota(): number {
  // Default to 5MB (conservative estimate)
  // In practice, browsers typically allow 5-10MB
  return 5 * 1024 * 1024; // 5MB in bytes
}

/**
 * Get storage information
 */
export function getStorageInfo(): StorageInfo {
  const used = estimateStorageSize();
  const total = getStorageQuota();
  const available = total - used;
  const percentageUsed = total > 0 ? used / total : 0;
  const shouldWarn = percentageUsed >= (1 - GUEST_LIMITS.STORAGE_WARNING_THRESHOLD);

  return {
    used,
    available,
    total,
    percentageUsed,
    shouldWarn,
  };
}

/**
 * Hook to monitor localStorage usage
 */
export function useStorageMonitor() {
  const [storageInfo, setStorageInfo] = useState<StorageInfo>(() => getStorageInfo());
  const [hasShownWarning, setHasShownWarning] = useState(false);

  const checkStorage = useCallback(() => {
    const info = getStorageInfo();
    setStorageInfo(info);
    
    // Show warning if threshold is reached and we haven't shown it yet
    if (info.shouldWarn && !hasShownWarning) {
      setHasShownWarning(true);
      return true; // Indicates warning should be shown
    }
    
    // Reset warning flag if storage is below threshold
    if (!info.shouldWarn && hasShownWarning) {
      setHasShownWarning(false);
    }
    
    return false;
  }, [hasShownWarning]);

  useEffect(() => {
    // Check storage on mount
    checkStorage();

    // Check storage periodically (every 30 seconds)
    const interval = setInterval(() => {
      checkStorage();
    }, 30000);

    // Check storage when localStorage changes
    const handleStorageChange = () => {
      checkStorage();
    };

    // Listen to storage events (from other tabs/windows)
    window.addEventListener('storage', handleStorageChange);

    // Custom event for same-tab storage changes
    // Note: We'll need to dispatch this event when we modify localStorage
    window.addEventListener('localStorageChange', handleStorageChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('localStorageChange', handleStorageChange);
    };
  }, [checkStorage]);

  return {
    storageInfo,
    shouldWarn: storageInfo.shouldWarn && !hasShownWarning,
    checkStorage,
    formatBytes: (bytes: number) => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    },
  };
}

/**
 * Dispatch custom event when localStorage is modified
 * Call this after any localStorage write operation
 */
export function notifyStorageChange() {
  window.dispatchEvent(new Event('localStorageChange'));
}
