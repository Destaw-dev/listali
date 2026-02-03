/**
 * Guest Mode Limits
 * Defines all restrictions and quotas for guest users
 */

export const GUEST_LIMITS = {
  // Lists & Items
  MAX_LISTS: 10,
  MAX_LIST_WARNING: 8,
  MAX_ITEMS_PER_LIST: 50,
  MAX_ITEMS_WARNING: 40,

  // Products - הכל זמין אבל מוגבל
  MAX_PRODUCTS_TO_LOAD: 30,        // מקסימום מוצרים (סך הכל)
  MAX_PRODUCT_PAGES: 2,            // מקסימום עמודים ב-infinite scroll
  MAX_IMAGES_TO_LOAD: 20,          // מקסימום תמונות לטעינה
  MAX_SEARCH_ATTEMPTS: 5,          // מקסימום חיפושים
  MIN_SEARCH_CHARS: 3,             // מינימום תווים לחיפוש (במקום 2)
  SEARCH_COOLDOWN_MS: 1000,        // cooldown בין חיפושים (ms)

  // Storage
  STORAGE_WARNING_THRESHOLD: 0.2,  // 20% remaining space warning
} as const;
