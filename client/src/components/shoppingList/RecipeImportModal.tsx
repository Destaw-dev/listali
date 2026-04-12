"use client";

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { AlertTriangle, Package, Wand2 } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useParseRecipe } from '../../hooks/useAi';
import { useAvailableCategories } from '../../hooks/useItems';
import { findExistingItem } from '../../lib/utils';
import { ICategory, IItem } from '../../types';

const HEBREW_TO_UNIT: Record<string, string> = {
  'יחידה': 'piece',
  'ק"ג': 'kg',
  'גרם': 'g',
  'ליטר': 'l',
  'מ"ל': 'ml',
  'אריזה': 'package',
  'קופסה': 'box',
  'שקית': 'bag',
  'בקבוק': 'bottle',
  'קופסת שימורים': 'can',
  'כוס': 'package',
  'כף': 'package',
  'כפית': 'piece',
};

const UNITS = [
  { value: 'piece', label: 'יחידה' },
  { value: 'kg', label: 'ק"ג' },
  { value: 'g', label: 'גרם' },
  { value: 'l', label: 'ליטר' },
  { value: 'ml', label: 'מ"ל' },
  { value: 'package', label: 'אריזה' },
  { value: 'box', label: 'קופסה' },
  { value: 'bag', label: 'שקית' },
  { value: 'bottle', label: 'בקבוק' },
  { value: 'can', label: 'קופסת שימורים' },
];

interface ParsedRecipeItem {
  name: string;
  quantity?: number | null;
  unit: string;
  category: string;
  categoryId?: string | null;
  productId?: string | null;
}

interface ParseRecipeResponse {
  items?: ParsedRecipeItem[];
}

interface WebkitSpeechRecognitionResultItem {
  transcript: string;
}

interface WebkitSpeechRecognitionResult {
  0: WebkitSpeechRecognitionResultItem;
}

interface WebkitSpeechRecognitionResultList {
  0: WebkitSpeechRecognitionResult;
}

interface WebkitSpeechRecognitionEvent {
  results: WebkitSpeechRecognitionResultList;
}

interface WebkitSpeechRecognitionInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onresult: ((event: WebkitSpeechRecognitionEvent) => void) | null;
  start: () => void;
}

interface WebkitSpeechRecognitionConstructor {
  new (): WebkitSpeechRecognitionInstance;
}

type WindowWithWebkitSpeechRecognition = Window & {
  webkitSpeechRecognition?: WebkitSpeechRecognitionConstructor;
};

export interface EditableItem {
  name: string;
  quantity: number;
  unit: string;
  category: string;
  categoryId?: string;
  productId?: string;
  selected: boolean;
  isDuplicate: boolean;
}

interface RecipeImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddItems: (items: EditableItem[]) => void;
  currentItems: IItem[];
}

export default function RecipeImportModal({ isOpen, onClose, onAddItems, currentItems }: RecipeImportModalProps) {
  const t = useTranslations('RecipeImportModal');
  const [text, setText] = useState('');
  const [editableItems, setEditableItems] = useState<EditableItem[]>([]);
  const [hasParsed, setHasParsed] = useState(false);
  const [error, setError] = useState('');
  const [isListening, setIsListening] = useState(false);

  const { mutateAsync: parseRecipe, isPending: isLoading } = useParseRecipe();
  const { data: categories = [] } = useAvailableCategories();

  if (!isOpen) return null;

  const handleAnalyze = async () => {
    if (!text.trim()) return;
    setError('');
    setEditableItems([]);
    setHasParsed(false);

    try {
      const data: ParseRecipeResponse = await parseRecipe(text);
      const rawItems = data.items || [];

      const parsed: EditableItem[] = rawItems.map((item: ParsedRecipeItem) => {
        const unit = HEBREW_TO_UNIT[item.unit] || 'piece';
        const categoryObj = !item.categoryId
          ? (categories as ICategory[]).find(c => c.name === item.category)
          : undefined;
        const resolvedCategoryId = item.categoryId ?? categoryObj?._id;
        const isDuplicate = !!findExistingItem(currentItems, { name: item.name, unit });
        return {
          name: item.name,
          quantity: item.quantity || 1,
          unit,
          category: item.category,
          categoryId: resolvedCategoryId,
          productId: item.productId ?? undefined,
          selected: !isDuplicate && !!resolvedCategoryId,
          isDuplicate,
        };
      });
      setEditableItems(parsed);
      setHasParsed(true);
    } catch {
      setError(t('error'));
    }
  };

  const updateItem = <K extends keyof EditableItem>(idx: number, field: K, value: EditableItem[K]) => {
    setEditableItems(prev => prev.map((item, i) => {
      if (i !== idx) return item;
      if (field === 'categoryId') {
        const cat = (categories as ICategory[]).find(c => c._id === value);
        return {
          ...item,
          categoryId: value as EditableItem['categoryId'],
          category: cat?.name ?? item.category,
        };
      }
      return { ...item, [field]: value };
    }));
  };

  const handleBack = () => {
    setHasParsed(false);
    setEditableItems([]);
  };

  const handleAdd = () => {
    const hasSelectedItemsWithoutCategory = editableItems.some(item => item.selected && !item.categoryId);
    if (hasSelectedItemsWithoutCategory) {
      setError(t('missingCategory'));
      return;
    }

    const selected = editableItems.filter(i => i.selected);
    onAddItems(selected);
    onClose();
    setText('');
    setEditableItems([]);
    setHasParsed(false);
  };

  const handleVoiceInput = () => {
    const speechWindow = window as WindowWithWebkitSpeechRecognition;
    const SpeechRecognition = speechWindow.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert(t('browserNotSupported'));
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'he-IL';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: WebkitSpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      setText(prev => prev ? prev + '\n' + transcript : transcript);
    };
    recognition.start();
  };

  const selectedCount = editableItems.filter(i => i.selected).length;
  const selectedWithoutCategoryCount = editableItems.filter(item => item.selected && !item.categoryId).length;

  return (
    <Modal
      title={t('title')}
      subtitle={t('description')}
      iconHeader={<Wand2 className="h-5 w-5 text-primary" aria-hidden="true" />}
      onClose={onClose}
      size="xl"
    >
      {!hasParsed && (
        <>
          <div className="relative">
            <textarea
              className="h-40 w-full rounded-xl border border-border bg-surface p-3 pb-12 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder={t('placeholder')}
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={isLoading || isListening}
            />
            <button
              onClick={handleVoiceInput}
              disabled={isLoading || isListening}
              aria-label={isListening ? t('listening') : t('startListening')}
              aria-pressed={isListening}
              className={`absolute bottom-3 start-3 rounded-full p-2 transition-colors ${
                isListening
                  ? 'animate-pulse bg-error/10 text-error'
                  : 'bg-surface-hover text-text-muted hover:text-text-primary'
              }`}
            >
              <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" y1="19" x2="12" y2="23"/>
                <line x1="8" y1="23" x2="16" y2="23"/>
              </svg>
            </button>
          </div>
        </>
      )}

      {hasParsed && editableItems.length === 0 && (
        <div className="py-8 text-center">
          <p className="text-text-muted">{t('noItemsFound')}</p>
          <Button variant="ghost" size="sm" onClick={handleBack} className="mt-3">
            {t('analyze')}
          </Button>
        </div>
      )}

      {hasParsed && editableItems.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium text-text-secondary">{t('selectItems')}:</p>
          {selectedWithoutCategoryCount > 0 && (
            <p role="alert" className="mb-3 text-sm text-error">
              {t('missingCategory')}
            </p>
          )}
          <ul role="list" className="max-h-72 space-y-1 overflow-y-auto">
            {editableItems.map((item, idx) => (
              <li
                key={idx}
                className={`flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors ${
                  item.selected && !item.categoryId
                    ? 'bg-error/5'
                    : item.isDuplicate
                      ? 'bg-warning/5'
                      : 'hover:bg-surface-hover'
                }`}
              >
                <input
                  id={`recipe-item-${idx}`}
                  type="checkbox"
                  checked={item.selected}
                  onChange={() => updateItem(idx, 'selected', !item.selected)}
                  className="h-4 w-4 shrink-0 rounded border-border text-primary focus:ring-primary"
                  aria-label={item.name}
                />

                <input
                  type="text"
                  value={item.name}
                  onChange={(e) => updateItem(idx, 'name', e.target.value)}
                  aria-label="שם פריט"
                  className="min-w-0 flex-1 rounded border border-transparent bg-transparent px-1 py-0.5 text-sm text-text-primary hover:border-border focus:border-primary focus:outline-none"
                />

                <input
                  type="number"
                  value={item.quantity}
                  min={0.01}
                  step={0.5}
                  onChange={(e) => updateItem(idx, 'quantity', parseFloat(e.target.value) || 1)}
                  aria-label="כמות"
                  className="w-14 shrink-0 rounded border border-transparent bg-transparent px-1 py-0.5 text-center text-sm text-text-primary hover:border-border focus:border-primary focus:outline-none"
                />

                <select
                  value={item.unit}
                  onChange={(e) => updateItem(idx, 'unit', e.target.value)}
                  aria-label="יחידה"
                  className="shrink-0 rounded border border-transparent bg-transparent px-1 py-0.5 text-sm text-text-primary hover:border-border focus:border-primary focus:outline-none"
                >
                  {UNITS.map(u => (
                    <option key={u.value} value={u.value}>{u.label}</option>
                  ))}
                </select>

                <select
                  value={item.categoryId ?? ''}
                  onChange={(e) => updateItem(idx, 'categoryId', e.target.value)}
                  aria-label="קטגוריה"
                  className={`shrink-0 rounded border bg-transparent px-1 py-0.5 text-sm hover:border-border focus:border-primary focus:outline-none ${
                    item.selected && !item.categoryId
                      ? 'border-error text-error'
                      : 'border-transparent text-text-muted'
                  }`}
                >
                  <option value="">{t('uncategorizedOption')}</option>
                  {(categories as ICategory[]).map(c => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>

                {item.isDuplicate && (
                  <span title="כבר ברשימה" aria-label="פריט כבר קיים ברשימה" className="shrink-0">
                    <AlertTriangle className="h-4 w-4 text-warning" aria-hidden="true" />
                  </span>
                )}

                {item.productId && (
                  <span title="מוצר נמצא במערכת" aria-label="מוצר קיים במערכת" className="shrink-0">
                    <Package className="h-4 w-4 text-success" aria-hidden="true" />
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {error && <p role="alert" className="mt-3 text-sm text-error">{error}</p>}

      <div className="mt-5 flex justify-end gap-3">
        <Button variant="ghost" size="sm" onClick={onClose}>{t('cancel')}</Button>

        {!hasParsed ? (
          <Button onClick={handleAnalyze} disabled={isLoading || !text.trim()} loading={isLoading}>
            {isLoading ? t('analyzing') : t('analyze')}
          </Button>
        ) : (
          <>
            {editableItems.length > 0 && (
              <Button variant="outline" size="sm" onClick={handleBack}>{t('back')}</Button>
            )}
            <Button onClick={handleAdd} disabled={selectedCount === 0 || selectedWithoutCategoryCount > 0}>
              {t('addItems', { count: selectedCount })}
            </Button>
          </>
        )}
      </div>
    </Modal>
  );
}
