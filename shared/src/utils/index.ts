// Date and time utilities
export const formatDate = (date: Date | string): string => {
  const d = new Date(date);
  return d.toLocaleDateString();
};

export const formatDateTime = (date: Date | string): string => {
  const d = new Date(date);
  return d.toLocaleString();
};

export const formatRelativeTime = (date: Date | string): string => {
  const now = new Date();
  const target = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - target.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  
  return formatDate(date);
};

// String utilities
export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const truncate = (str: string, length: number): string => {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
};

export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

// Validation utilities
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPassword = (password: string): boolean => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

export const isValidUsername = (username: string): boolean => {
  // 3-20 characters, alphanumeric and underscore only
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  return usernameRegex.test(username);
};

// Array utilities
export const groupBy = <T, K extends string>(array: T[], key: (item: T) => K): Record<K, T[]> => {
  return array.reduce((groups, item) => {
    const group = key(item);
    if (!groups[group]) {
      groups[group] = [];
    }
    groups[group].push(item);
    return groups;
  }, {} as Record<K, T[]>);
};

export const sortBy = <T>(array: T[], key: keyof T, order: 'asc' | 'desc' = 'asc'): T[] => {
  return [...array].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    
    if (aVal < bVal) return order === 'asc' ? -1 : 1;
    if (aVal > bVal) return order === 'asc' ? 1 : -1;
    return 0;
  });
};

export const unique = <T>(array: T[]): T[] => {
  return [...new Set(array)];
};

// Number utilities
export const formatCurrency = (amount: number, currency: string = 'ILS'): string => {
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('he-IL').format(num);
};

export const roundToDecimals = (num: number, decimals: number = 2): number => {
  return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
};

// Color utilities
export const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

export const rgbToHex = (r: number, g: number, b: number): string => {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
};

// Storage utilities (platform-agnostic)
export const storage = {
  get: (key: string): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(key);
    }
    return null;
  },
  
  set: (key: string, value: string): void => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, value);
    }
  },
  
  remove: (key: string): void => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(key);
    }
  },
  
  clear: (): void => {
    if (typeof window !== 'undefined') {
      localStorage.clear();
    }
  }
};

// Debounce utility
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Throttle utility
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Error handling utilities
export const handleError = (error: any): string => {
  if (typeof error === 'string') return error;
  if (error?.message) return error.message;
  if (error?.response?.data?.message) return error.response.data.message;
  return 'An unexpected error occurred';
};

// URL utilities
export const getQueryParam = (param: string): string | null => {
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
  }
  return null;
};

export const setQueryParam = (param: string, value: string): void => {
  if (typeof window !== 'undefined') {
    const url = new URL(window.location.href);
    url.searchParams.set(param, value);
    window.history.replaceState({}, '', url.toString());
  }
};

// Device detection
export const isMobile = (): boolean => {
  if (typeof window !== 'undefined') {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }
  return false;
};

export const isIOS = (): boolean => {
  if (typeof window !== 'undefined') {
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
  }
  return false;
};

export const isAndroid = (): boolean => {
  if (typeof window !== 'undefined') {
    return /Android/.test(navigator.userAgent);
  }
  return false;
};

// Network utilities
export const isOnline = (): boolean => {
  if (typeof window !== 'undefined') {
    return navigator.onLine;
  }
  return true;
};

import { IProduct, IItem } from '../types';

// Deep clone utility
export const deepClone = <T>(obj: T): T => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T;
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as unknown as T;
  if (typeof obj === 'object') {
    const clonedObj = {} as T;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
  return obj;
};

// Product-Item utilities
export const createItemFromProduct = (product: IProduct, quantity: number = 1, unit?: string): Partial<IItem> => {
  return {
    name: product.name,
    description: product.brand ? `${product.brand} - ${product.name}` : product.name,
    quantity,
    unit: unit || product.defaultUnit || 'piece',
    category: product.categoryId, // Use category ID from product
    brand: product.brand,
    estimatedPrice: product.averagePrice || product.price,
    image: product.image,
    barcode: product.barcode,
    product: product._id,
    isManualEntry: false,
  };
};

export const isProductBasedItem = (item: IItem): boolean => {
  return !item.isManualEntry && !!item.product;
};

export const getItemDisplayName = (item: IItem): string => {
  if (item.brand && item.name !== item.brand) {
    return `${item.name} (${item.brand})`;
  }
  return item.name;
};

export const getItemPrice = (item: IItem): number | undefined => {
  return item.actualPrice || item.estimatedPrice;
};

export const getItemTotalPrice = (item: IItem): number => {
  const price = getItemPrice(item);
  return price ? price * item.quantity : 0;
};

// Item creation utilities
export const createManualItem = (itemData: {
  name: string;
  quantity: number;
  unit: string;
  category: string; // Category ID reference
  brand?: string;
  estimatedPrice?: number;
  description?: string;
  notes?: string;
}): Partial<IItem> => {
  return {
    ...itemData,
    isManualEntry: true,
    product: undefined,
  };
};

export const createProductBasedItem = (product: IProduct, itemData: {
  quantity: number;
  unit?: string;
  notes?: string;
}): Partial<IItem> => {
  return {
    ...createItemFromProduct(product, itemData.quantity, itemData.unit),
    notes: itemData.notes,
  };
};

// Item validation
export const validateItemData = (itemData: Partial<IItem>): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!itemData.name?.trim()) {
    errors.push('Item name is required');
  }
  
  if (!itemData.quantity || itemData.quantity <= 0) {
    errors.push('Quantity must be greater than 0');
  }
  
  if (!itemData.unit) {
    errors.push('Unit is required');
  }
  
  if (!itemData.category) {
    errors.push('Category ID is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Product search utilities
export const searchProductsForItem = async (
  query: string,
  onResults: (products: IProduct[]) => void,
  onError: (error: string) => void,
  categoryId?: string
): Promise<void> => {
  try {
    if (query.length < 2) {
      onResults([]);
      return;
    }
  } catch (error) {
    onError('Failed to search products');
  }
}; 