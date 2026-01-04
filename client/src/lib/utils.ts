import { IManualProduct, IProduct } from '@/types';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function hasIsManualProduct(
  product: IProduct | IManualProduct | string | undefined
): product is IManualProduct {
  return typeof product === 'object' && product !== null && 'isManual' in product && (product as IManualProduct).isManual === true;
}


export function getProductUnit(product: {
  defaultUnit?: string;
  units?: string[];
  name?: string;
}): string {
  if (product.defaultUnit && (product.defaultUnit.includes('משקל') || product.defaultUnit.includes('במשקל'))) {
    if (product.defaultUnit.includes('ק״ג') || product.defaultUnit.includes('קילוגרם')) {
      return 'kg';
    }
    return 'kg';
  }

  return 'piece';
}

/**
 * Safely extracts units from a product that can be a string, object, or undefined
 */
export function getProductUnits(product: string | { units?: string[] } | undefined): string[] {
  if (!product) return [];
  if (typeof product === 'string') return [];
  if (typeof product === 'object' && 'units' in product && Array.isArray(product.units)) {
    return product.units;
  }
  return [];
}

/**
 * Find an existing item by product ID.
 * @param existingItems - Array of items (can be partial items in some contexts)
 * @param newItemId - The product ID to search for
 * @returns The found item or null
 */
export function findExistingItemById<T extends { product?: string | { _id?: string }; productId?: string }>(
  existingItems: T[],
  newItemId: string,
): T | null {
  if (!existingItems || existingItems.length === 0) {
    return null;
  }
  const result = existingItems.find((item) => {
    // product can be string (product ID) or object with _id
    const productId = typeof item.product === 'string' 
      ? item.product 
      : (item.product as { _id?: string } | undefined)?._id;
    return productId === newItemId || item.productId === newItemId;
  });
  return result || null;
}

/**
 * Find an existing item by matching name, unit, category, or product.
 * @param existingItems - Array of items (can be partial items in some contexts)
 * @param newItem - The item data to search for
 * @returns The found item or null
 */
export function findExistingItem<T extends { 
  _id?: string;
  name?: string;
  unit?: string;
  category?: string | { _id?: string };
  product?: string | { _id?: string };
  productId?: string;
  status?: string;
}>(
  existingItems: T[],
  newItem: {
    name: string;
    unit: string;
    category?: string;
    product?: string;
  }
): T | null {
  if (!existingItems || existingItems.length === 0) {
    return null;
  }

  if (newItem.product) {
    const existing = existingItems.find((item) => {
      // product can be string (product ID) or object with _id
      const itemProductId = typeof item.product === 'string' 
        ? item.product 
        : (item.product as { _id?: string } | undefined)?._id || item.productId;
      return (
        itemProductId === newItem.product &&
        item.unit === newItem.unit &&
        item.status !== 'cancelled'
      );
    });
    if (existing) return existing;
  }

  const existing = existingItems.find((item) => {
    // category can be string or object with _id
    const itemCategoryId = typeof item.category === 'string' 
      ? item.category 
      : (item.category as { _id?: string } | undefined)?._id;
    const newCategoryId = newItem.category;
    
    const itemName = (item.name || '').trim().replace(/\s+/g, ' ');
    const newItemName = (newItem.name || '').trim().replace(/\s+/g, ' ');
    
    return (
      item._id === newItem.product &&
      itemName === newItemName &&
      item.unit === newItem.unit &&
      itemCategoryId === newCategoryId &&
      item.status !== 'cancelled'
    );
  });

  return existing || null;
}

export function mapInviteErrorToTranslationKey(errorMessage: string): string {
  const errorMap: Record<string, string> = {
    'This invitation has expired. Please request a new invitation from the group admin.': 'invitations.expired',
    'The email address used for registration does not match the email address that received the invitation.': 'invitations.emailMismatch',
    'Invalid invitation code. Please check the invitation link or request a new one.': 'invitations.invalidCode',
    'Invalid invitation code. The group may not exist or the invitation may have been cancelled.': 'invitations.invalidCodeOrCancelled',
    'Failed to process the invitation. Please contact the group admin for assistance.': 'invitations.processingFailed',
  };

  return errorMap[errorMessage] || errorMessage;
}

export const unitLabels: Record<string, string> = {
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

export const hebrewToEnglish: Record<string, string> = {
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

export function normalizeUnit(unit: string): string {
  if (unitLabels[unit]) {
    return unit;
  }
  if (hebrewToEnglish[unit]) {
    return hebrewToEnglish[unit];
  }
  const lowerUnit = unit.toLowerCase();
  if (unitLabels[lowerUnit]) {
    return lowerUnit;
  }
  return unit;
}

export function extractImageUrl(
  image: string | 
  { primary?: string; providers?: Record<string, { url?: string }> } |
  { primary: string; providers: { cloudinary?: { url: string }; imagekit?: { url: string } } } |
  undefined
): string | undefined {
  if (typeof image === 'string') return image;
  if (!image || typeof image !== 'object') return undefined;
  
  // Type guard: check if it has the image object structure
  if ('primary' in image && 'providers' in image) {
    const primary = image.primary;
    const providers = image.providers;
    
    if (primary && providers && typeof providers === 'object') {
      // Handle both Record type and specific structure (cloudinary/imagekit)
      const providersRecord = providers as Record<string, { url?: string }>;
      return providersRecord[primary]?.url;
    }
  }
  
  return undefined;
}