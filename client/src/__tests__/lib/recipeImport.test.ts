import { describe, expect, it } from 'vitest';
import {
  mapParsedRecipeItems,
  resolveQuantity,
  resolveUnit,
} from '../../lib/recipeImport';

describe('recipe import normalization', () => {
  it.each([undefined, null, 0, -1, Number.NaN, '2'])(
    'defaults an invalid AI quantity (%s) to one',
    (quantity) => {
      expect(resolveQuantity(quantity)).toBe(1);
    },
  );

  it('preserves positive finite AI quantities', () => {
    expect(resolveQuantity(2.5)).toBe(2.5);
  });

  it.each([undefined, null, 12, {}])(
    'defaults a missing or malformed AI unit (%s) to piece',
    (unit) => {
      expect(resolveUnit(unit)).toBe('piece');
    },
  );

  it('normalizes malformed AI fields while mapping items', () => {
    const items = mapParsedRecipeItems(
      [{ name: 'חלב', quantity: 0, unit: undefined, category: 'לא מסווג' }],
      { byId: new Map(), byName: new Map() },
      [],
    );

    expect(items[0]).toMatchObject({ quantity: 1, unit: 'piece' });
  });
});
