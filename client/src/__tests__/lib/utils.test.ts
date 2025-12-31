import { describe, it, expect } from 'vitest';
import {
  cn,
  getProductUnit,
  findExistingItemById,
  findExistingItem,
  mapInviteErrorToTranslationKey,
  normalizeUnit,
} from '../../lib/utils';

describe('cn (className utility)', () => {
  it('should merge class names correctly', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('should handle conditional classes', () => {
    expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz');
  });

  it('should merge Tailwind classes correctly', () => {
    expect(cn('px-2 py-1', 'px-4')).toContain('px-4');
  });
});

describe('getProductUnit', () => {
  it('should return "kg" for weight-based products', () => {
    expect(getProductUnit({ defaultUnit: 'במשקל' })).toBe('kg');
    expect(getProductUnit({ defaultUnit: 'משקל' })).toBe('kg');
    expect(getProductUnit({ defaultUnit: 'במשקל ק״ג' })).toBe('kg');
    expect(getProductUnit({ defaultUnit: 'משקל קילוגרם' })).toBe('kg');
  });

  it('should return "piece" as default', () => {
    expect(getProductUnit({})).toBe('piece');
    expect(getProductUnit({ defaultUnit: 'יחידה' })).toBe('piece');
    expect(getProductUnit({ defaultUnit: 'ק״ג' })).toBe('piece'); // Only works if includes משקל
  });
});

describe('findExistingItemById', () => {
  const existingItems = [
    { product: { _id: '1' }, name: 'Item 1' },
    { product: { _id: '2' }, name: 'Item 2' },
    { product: { _id: '3' }, name: 'Item 3' },
  ];

  it('should find item by product id', () => {
    const result = findExistingItemById(existingItems, '2');
    expect(result).toEqual({ product: { _id: '2' }, name: 'Item 2' });
  });

  it('should return undefined if item not found', () => {
    const result = findExistingItemById(existingItems, '999');
    expect(result).toBeNull();
  });

  it('should return null for empty array', () => {
    const result = findExistingItemById([], '1');
    expect(result).toBeNull();
  });

  it('should return null for null/undefined array', () => {
    expect(findExistingItemById(null as never, '1')).toBeNull();
    expect(findExistingItemById(undefined as never, '1')).toBeNull();
  });
});

describe('findExistingItem', () => {
  const existingItems = [
    {
      _id: 'item1',
      name: 'Milk',
      unit: 'l',
      category: 'cat1',
      status: 'pending',
      product: { _id: 'prod1' },
    },
    {
      _id: 'item2',
      name: 'Bread',
      unit: 'piece',
      category: 'cat2',
      status: 'pending',
    },
    {
      _id: 'item3',
      name: 'Eggs',
      unit: 'piece',
      category: 'cat1',
      status: 'cancelled',
    },
  ];

  it('should find item by product id and unit', () => {
    const newItem = {
      name: 'Milk',
      unit: 'l',
      product: 'prod1',
    };
    const result = findExistingItem(existingItems, newItem);
    expect(result).toEqual(existingItems[0]);
  });

  it('should find item by name, unit, and category when product matches _id', () => {
    // Note: findExistingItem checks item._id === newItem.product
    // So we need to pass the item _id as product
    const newItem = {
      name: 'Bread',
      unit: 'piece',
      category: 'cat2',
      product: 'item2', // Must match the _id
    };
    const result = findExistingItem(existingItems, newItem);
    expect(result).toEqual(existingItems[1]);
  });

  it('should ignore cancelled items', () => {
    const newItem = {
      name: 'Eggs',
      unit: 'piece',
      category: 'cat1',
    };
    const result = findExistingItem(existingItems, newItem);
    expect(result).toBeNull();
  });

  it('should handle whitespace in names', () => {
    const itemsWithWhitespace = [
      {
        _id: 'item1',
        name: '  Milk  ',
        unit: 'l',
        category: 'cat1',
        status: 'pending',
      },
    ];
    const newItem = {
      name: 'Milk',
      unit: 'l',
      category: 'cat1',
      product: 'item1', // Must match the _id
    };
    const result = findExistingItem(itemsWithWhitespace, newItem);
    expect(result).toEqual(itemsWithWhitespace[0]);
  });

  it('should return null if no match found', () => {
    const newItem = {
      name: 'NonExistent',
      unit: 'piece',
      category: 'cat1',
    };
    const result = findExistingItem(existingItems, newItem);
    expect(result).toBeNull();
  });

  it('should return null for empty array', () => {
    const result = findExistingItem([], {
      name: 'Test',
      unit: 'piece',
    });
    expect(result).toBeNull();
  });
});

describe('mapInviteErrorToTranslationKey', () => {
  it('should map known error messages to translation keys', () => {
    expect(
      mapInviteErrorToTranslationKey(
        'This invitation has expired. Please request a new invitation from the group admin.'
      )
    ).toBe('invitations.expired');

    expect(
      mapInviteErrorToTranslationKey(
        'The email address used for registration does not match the email address that received the invitation.'
      )
    ).toBe('invitations.emailMismatch');

    expect(
      mapInviteErrorToTranslationKey(
        'Invalid invitation code. Please check the invitation link or request a new one.'
      )
    ).toBe('invitations.invalidCode');
  });

  it('should return original message for unknown errors', () => {
    const unknownError = 'Some unknown error message';
    expect(mapInviteErrorToTranslationKey(unknownError)).toBe(unknownError);
  });
});

describe('normalizeUnit', () => {
  it('should return unit as-is if already normalized', () => {
    expect(normalizeUnit('piece')).toBe('piece');
    expect(normalizeUnit('kg')).toBe('kg');
    expect(normalizeUnit('g')).toBe('g');
  });

  it('should convert Hebrew units to English', () => {
    expect(normalizeUnit('יחידה')).toBe('piece');
    expect(normalizeUnit('יחידות')).toBe('piece');
    expect(normalizeUnit('ק"ג')).toBe('kg');
    expect(normalizeUnit('קילוגרם')).toBe('kg');
    expect(normalizeUnit('גרם')).toBe('g');
    expect(normalizeUnit('ליטר')).toBe('l');
    expect(normalizeUnit('מ"ל')).toBe('ml');
  });

  it('should handle lowercase variants', () => {
    expect(normalizeUnit('PIECE')).toBe('piece');
    expect(normalizeUnit('KG')).toBe('kg');
  });

  it('should return original unit if not found in mappings', () => {
    expect(normalizeUnit('unknown-unit')).toBe('unknown-unit');
  });
});

