import { ICategory, IItem, IItemUnit } from '../types';
import { findExistingItem, normalizeUnit } from './utils';

export interface EditableItem {
  name: string;
  quantity: number;
  unit: IItemUnit;
  category: string;
  categoryId?: string;
  productId?: string;
  selected: boolean;
  isDuplicate: boolean;
}

export interface ParsedRecipeItem {
  name: string;
  quantity?: unknown;
  unit?: unknown;
  category: string;
  categoryId?: string | null;
  productId?: string | null;
}

export const RECIPE_UNITS: { value: IItemUnit; label: string }[] = [
  { value: 'piece',   label: 'יחידה' },
  { value: 'kg',      label: 'ק"ג' },
  { value: 'g',       label: 'גרם' },
  { value: 'l',       label: 'ליטר' },
  { value: 'ml',      label: 'מ"ל' },
  { value: 'package', label: 'אריזה' },
  { value: 'box',     label: 'קופסה' },
  { value: 'bag',     label: 'שקית' },
  { value: 'bottle',  label: 'בקבוק' },
  { value: 'can',     label: 'קופסת שימורים' },
];

const KNOWN_UNITS = new Set<string>(RECIPE_UNITS.map(u => u.value));

export interface CategoryMaps {
  byId: Map<string, ICategory>;
  byName: Map<string, ICategory>;
}

export function buildCategoryMaps(categories: ICategory[]): CategoryMaps {
  const byId = new Map<string, ICategory>();
  const byName = new Map<string, ICategory>();
  for (const cat of categories) {
    byId.set(cat._id, cat);
    byName.set(cat.name, cat);
  }
  return { byId, byName };
}

export function resolveUnit(rawUnit: unknown): IItemUnit {
  if (typeof rawUnit !== 'string') return 'piece';
  const normalized = normalizeUnit(rawUnit);
  return KNOWN_UNITS.has(normalized) ? (normalized as IItemUnit) : 'piece';
}

export function resolveQuantity(rawQuantity: unknown): number {
  return typeof rawQuantity === 'number'
    && Number.isFinite(rawQuantity)
    && rawQuantity > 0
    ? rawQuantity
    : 1;
}

export function resolveCategoryId(
  aiCategoryId: string | null | undefined,
  aiCategoryName: string,
  maps: CategoryMaps,
): string | undefined {
  if (aiCategoryId && maps.byId.has(aiCategoryId)) {
    return aiCategoryId;
  }
  return maps.byName.get(aiCategoryName)?._id;
}

export function parseQuantityInput(raw: string): number {
  const parsed = parseFloat(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

export function mapParsedRecipeItems(
  rawItems: ParsedRecipeItem[],
  maps: CategoryMaps,
  currentItems: IItem[],
): EditableItem[] {
  return rawItems.map((item) => {
    const unit = resolveUnit(item.unit);
    const categoryId = resolveCategoryId(item.categoryId, item.category, maps);
    const isDuplicate = !!findExistingItem(currentItems, { name: item.name, unit });

    return {
      name:       item.name,
      quantity:   resolveQuantity(item.quantity),
      unit,
      category:   item.category,
      categoryId,
      productId:  item.productId ?? undefined,
      selected:   !isDuplicate && !!categoryId,
      isDuplicate,
    };
  });
}

export function validateEditableItems(items: EditableItem[]): boolean {
  return items.every(item => !item.selected || !!item.categoryId);
}
