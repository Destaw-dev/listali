import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility function to merge Tailwind CSS classes
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Map Hebrew unit names to English unit codes
const unitMap: Record<string, string> = {
  'יחידות': 'piece',
  'יחידה': 'piece',
  'ק״ג': 'kg',
  'קילוגרם': 'kg',
  'גרם': 'g',
  'ליטר': 'l',
  'ליטרים': 'l',
  'מ״ל': 'ml',
  'מיליליטר': 'ml',
  'במשקל': 'kg',
  'משקל': 'kg',
};

// Get product unit type based on product properties
export function getProductUnit(product: {
  defaultUnit?: string;
  units?: string[];
  name?: string;
}): string {
  // If defaultUnit explicitly states "במשקל" or "משקל", it's by weight
  if (product.defaultUnit && (product.defaultUnit.includes('משקל') || product.defaultUnit.includes('במשקל'))) {
    // Check if it's explicitly kg or g
    if (product.defaultUnit.includes('ק״ג') || product.defaultUnit.includes('קילוגרם')) {
      return 'kg';
    }
    // Default to kg for weight
    return 'kg';
  }

  // Check units array first


  // Default to piece
  return 'piece';
}

// Utility function to check if an item already exists in the list
export function findExistingItem(
  existingItems: any[],
  newItem: {
    name: string;
    unit: string;
    category?: string;
    product?: string;
  }
): any | null {
  if (!existingItems || existingItems.length === 0) {
    return null;
  }

  // If new item has a productId, search by productId + unit
  if (newItem.product) {
    const existing = existingItems.find((item: any) => {
      const itemProductId = item.product?._id || item.product;
      return (
        itemProductId === newItem.product &&
        item.unit === newItem.unit &&
        item.status !== 'cancelled'
      );
    });
    if (existing) return existing;
  }

  // Otherwise, search by name + unit + category
  const existing = existingItems.find((item: any) => {
    const itemCategoryId = item.category?._id || item.category;
    const newCategoryId = newItem.category;
    
    return (
      item.name === newItem.name &&
      item.unit === newItem.unit &&
      itemCategoryId === newCategoryId &&
      item.status !== 'cancelled'
    );
  });

  return existing || null;
}

// Map server invitation error messages to translation keys
export function mapInviteErrorToTranslationKey(errorMessage: string): string {
  const errorMap: Record<string, string> = {
    'This invitation has expired. Please request a new invitation from the group admin.': 'invitations.expired',
    'The email address used for registration does not match the email address that received the invitation.': 'invitations.emailMismatch',
    'Invalid invitation code. Please check the invitation link or request a new one.': 'invitations.invalidCode',
    'Invalid invitation code. The group may not exist or the invitation may have been cancelled.': 'invitations.invalidCodeOrCancelled',
    'Failed to process the invitation. Please contact the group admin for assistance.': 'invitations.processingFailed',
  };

  // Return the mapped key if found, otherwise return the original message
  return errorMap[errorMessage] || errorMessage;
}
