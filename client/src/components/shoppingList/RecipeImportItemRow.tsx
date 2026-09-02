import { memo } from 'react';
import { AlertTriangle, Package } from 'lucide-react';
import { ICategory, IItemUnit } from '../../types';
import { EditableItem, RECIPE_UNITS, parseQuantityInput } from '../../lib/recipeImport';
import { Input } from '../common/Input';

export interface RecipeImportItemRowProps {
  item: EditableItem;
  idx: number;
  categories: ICategory[];
  /** Called for scalar field changes: name, quantity, unit, selected */
  onFieldChange: (
    idx: number,
    field: keyof EditableItem,
    value: EditableItem[keyof EditableItem],
  ) => void;
  /** Separate callback for category — carries the ID; the modal resolves the name */
  onCategoryChange: (idx: number, categoryId: string) => void;
  uncategorizedLabel: string;
}

export const RecipeImportItemRow = memo(function RecipeImportItemRow({
  item,
  idx,
  categories,
  onFieldChange,
  onCategoryChange,
  uncategorizedLabel,
}: RecipeImportItemRowProps) {
  const rowBg =
    item.selected && !item.categoryId
      ? 'bg-error/5'
      : item.isDuplicate
        ? 'bg-warning/5'
        : 'hover:bg-surface-hover';

  return (
    <li className={`flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors ${rowBg}`}>
      {/* Selection checkbox */}
      <input
        id={`recipe-item-${idx}`}
        type="checkbox"
        checked={item.selected}
        onChange={() => onFieldChange(idx, 'selected', !item.selected)}
        className="h-4 w-4 shrink-0 rounded border-border text-primary focus:ring-primary"
        aria-label={item.name}
      />

      {/* Item name */}
      <Input
        type="text"
        value={item.name}
        onChange={(e) => onFieldChange(idx, 'name', e.target.value)}
        aria-label="שם פריט"
        variant="outlined"
        size="sm"
        className="px-1 py-0.5 border-transparent bg-transparent shadow-none hover:border-border"
        containerClassName="flex-1 min-w-0"
      />

      {/* Quantity */}
      <Input
        type="number"
        value={item.quantity}
        min={0.01}
        step={0.5}
        onChange={(e) => onFieldChange(idx, 'quantity', parseQuantityInput(e.target.value))}
        aria-label="כמות"
        variant="outlined"
        size="sm"
        className="w-14 px-1 py-0.5 text-center border-transparent bg-transparent shadow-none hover:border-border"
        containerClassName="shrink-0"
      />

      {/* Unit */}
      <select
        value={item.unit}
        onChange={(e) => onFieldChange(idx, 'unit', e.target.value as IItemUnit)}
        aria-label="יחידה"
        className="shrink-0 rounded border border-transparent bg-transparent px-1 py-0.5 text-sm text-text-primary hover:border-border focus:border-primary focus:outline-none"
      >
        {RECIPE_UNITS.map((u) => (
          <option key={u.value} value={u.value}>
            {u.label}
          </option>
        ))}
      </select>

      {/* Category */}
      <select
        value={item.categoryId ?? ''}
        onChange={(e) => onCategoryChange(idx, e.target.value)}
        aria-label="קטגוריה"
        className={`shrink-0 rounded border bg-transparent px-1 py-0.5 text-sm hover:border-border focus:border-primary focus:outline-none ${
          item.selected && !item.categoryId
            ? 'border-error text-error'
            : 'border-transparent text-text-muted'
        }`}
      >
        <option value="">{uncategorizedLabel}</option>
        {categories.map((c) => (
          <option key={c._id} value={c._id}>
            {c.name}
          </option>
        ))}
      </select>

      {/* Duplicate indicator */}
      {item.isDuplicate && (
        <span title="כבר ברשימה" aria-label="פריט כבר קיים ברשימה" className="shrink-0">
          <AlertTriangle className="h-4 w-4 text-warning" aria-hidden="true" />
        </span>
      )}

      {/* Matched product indicator */}
      {item.productId && (
        <span title="מוצר נמצא במערכת" aria-label="מוצר קיים במערכת" className="shrink-0">
          <Package className="h-4 w-4 text-success" aria-hidden="true" />
        </span>
      )}
    </li>
  );
});
