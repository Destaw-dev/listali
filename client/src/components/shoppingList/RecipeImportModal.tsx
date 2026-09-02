'use client';

import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Wand2 } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { TextArea } from '../common/Input';
import { useParseRecipe } from '../../hooks/useAi';
import { useAvailableCategories } from '../../hooks/useItems';
import { useModalScrollLock } from '../../hooks/useModalScrollLock';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import {
  buildCategoryMaps,
  mapParsedRecipeItems,
  validateEditableItems,
  ParsedRecipeItem,
} from '../../lib/recipeImport';
import { ICategory, IItem } from '../../types';
import { RecipeImportItemRow } from './RecipeImportItemRow';

// ---------------------------------------------------------------------------
// Re-export EditableItem so ShoppingListHeaderBar continues to import it here
// ---------------------------------------------------------------------------
export type { EditableItem } from '../../lib/recipeImport';
import type { EditableItem } from '../../lib/recipeImport';

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

interface RecipeImportState {
  text: string;
  editableItems: EditableItem[];
  /** Renamed from hasParsed */
  isParsed: boolean;
  error: string;
}

const initialState: RecipeImportState = {
  text: '',
  editableItems: [],
  isParsed: false,
  error: '',
};

type RecipeImportAction =
  | { type: 'SET_TEXT'; payload: string }
  | { type: 'PARSE_START' }
  | { type: 'PARSE_SUCCESS'; payload: EditableItem[] }
  | { type: 'PARSE_ERROR'; payload: string }
  | { type: 'UPDATE_ITEM'; payload: { idx: number; field: keyof EditableItem; value: EditableItem[keyof EditableItem] } }
  // Separate action so we can atomically update both categoryId and category name
  | { type: 'UPDATE_ITEM_CATEGORY'; payload: { idx: number; categoryId: string; categoryName: string } }
  | { type: 'BACK' }
  | { type: 'RESET' }
  | { type: 'SET_ERROR'; payload: string };

function recipeImportReducer(
  state: RecipeImportState,
  action: RecipeImportAction,
): RecipeImportState {
  switch (action.type) {
    case 'SET_TEXT':
      // Typing clears the current error — no stale messages while the user edits
      return { ...state, text: action.payload, error: '' };

    case 'PARSE_START':
      return { ...state, error: '', editableItems: [], isParsed: false };

    case 'PARSE_SUCCESS':
      return { ...state, editableItems: action.payload, isParsed: true };

    case 'PARSE_ERROR':
      return { ...state, error: action.payload };

    case 'UPDATE_ITEM': {
      const { idx, field, value } = action.payload;
      return {
        ...state,
        editableItems: state.editableItems.map((item, i) =>
          i !== idx ? item : { ...item, [field]: value },
        ),
      };
    }

    case 'UPDATE_ITEM_CATEGORY': {
      const { idx, categoryId, categoryName } = action.payload;
      return {
        ...state,
        editableItems: state.editableItems.map((item, i) =>
          i !== idx ? item : { ...item, categoryId, category: categoryName },
        ),
      };
    }

    case 'BACK':
      return { ...state, isParsed: false, editableItems: [] };

    case 'RESET':
      return initialState;

    case 'SET_ERROR':
      return { ...state, error: action.payload };

    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Component props
// ---------------------------------------------------------------------------

interface RecipeImportModalProps {
  isOpen: boolean;
  closesRecipeModalOpen: () => void;
  onAddItems: (items: EditableItem[]) => void;
  currentItems: IItem[];
}

interface ParseRecipeResponse {
  items?: ParsedRecipeItem[];
}

export default function RecipeImportModal({
  isOpen,
  closesRecipeModalOpen,
  onAddItems,
  currentItems,
}: RecipeImportModalProps) {
  const t = useTranslations('RecipeImportModal');

  const [state, dispatch] = useReducer(recipeImportReducer, initialState);
  const { text, editableItems, isParsed, error } = state;
  const parseRequestId = useRef(0);

  const { mutateAsync: parseRecipe, isPending: isLoading } = useParseRecipe();
  const { data: categories = [] } = useAvailableCategories();

  useModalScrollLock(isOpen);

  const categoryMaps = useMemo(
    () => buildCategoryMaps(categories as ICategory[]),
    [categories],
  );

  const selectedCount = useMemo(
    () => editableItems.filter((i) => i.selected).length,
    [editableItems],
  );

  const missingCategoryCount = useMemo(
    () => editableItems.filter((i) => i.selected && !i.categoryId).length,
    [editableItems],
  );

  const handleFieldChange = useCallback(
    (idx: number, field: keyof EditableItem, value: EditableItem[keyof EditableItem]) => {
      dispatch({ type: 'UPDATE_ITEM', payload: { idx, field, value } });
    },
    [],
  );

  const handleCategoryChange = useCallback(
    (idx: number, categoryId: string) => {
      const cat = categoryMaps.byId.get(categoryId);
      dispatch({
        type: 'UPDATE_ITEM_CATEGORY',
        payload: { idx, categoryId, categoryName: cat?.name ?? '' },
      });
    },
    [categoryMaps],
  );

  const handleAnalyze = async () => {
    if (!text.trim()) {
      dispatch({ type: 'SET_ERROR', payload: t('emptyText') });
      return;
    }
    const requestId = ++parseRequestId.current;
    dispatch({ type: 'PARSE_START' });
    try {
      const data: ParseRecipeResponse = await parseRecipe(text);
      if (requestId !== parseRequestId.current) return;
      const rawItems = data.items ?? [];
      const parsed = mapParsedRecipeItems(rawItems, categoryMaps, currentItems);
      dispatch({ type: 'PARSE_SUCCESS', payload: parsed });
    } catch {
      if (requestId !== parseRequestId.current) return;
      dispatch({ type: 'PARSE_ERROR', payload: t('error') });
    }
  };

  useEffect(() => () => {
    parseRequestId.current += 1;
  }, []);

  const { isListening, start: startListening, stop: stopListening } = useSpeechRecognition({
    lang: 'he-IL',
    onResult: (transcript) => {
      dispatch({
        type: 'SET_TEXT',
        payload: text ? `${text}\n${transcript}` : transcript,
      });
    },
    onNotSupported: () => {
      dispatch({ type: 'SET_ERROR', payload: t('browserNotSupported') });
    },
  });

  const handleAdd = () => {
    if (!validateEditableItems(editableItems)) {
      dispatch({ type: 'SET_ERROR', payload: t('missingCategory') });
      return;
    }
    onAddItems(editableItems.filter((i) => i.selected));
    stopListening();
    parseRequestId.current += 1;
    dispatch({ type: 'RESET' });
    closesRecipeModalOpen();
  };

  const handleClose = () => {
    stopListening();
    parseRequestId.current += 1;
    dispatch({ type: 'RESET' });
    closesRecipeModalOpen();
  };

  const handleBack = () => dispatch({ type: 'BACK' });

  if (!isOpen) return null;

  return (
    <Modal
      title={t('title')}
      subtitle={t('description')}
      iconHeader={<Wand2 className="h-5 w-5 text-primary" aria-hidden="true" />}
      onClose={handleClose}
      size="xl"
    >
      {/* Input view */}
      {!isParsed && (
        <div className="relative">
          <TextArea
            variant="outlined"
            value={text}
            onChange={(e) => dispatch({ type: 'SET_TEXT', payload: e.target.value })}
            placeholder={t('placeholder')}
            disabled={isLoading || isListening}
            className="h-40 rounded-xl p-3 pb-12 text-sm shadow-none"
            fullWidth
          />
          <button
            onClick={startListening}
            disabled={isLoading || isListening}
            aria-label={isListening ? t('listening') : t('startListening')}
            aria-pressed={isListening}
            className={`absolute bottom-3 start-3 rounded-full p-2 transition-colors ${
              isListening
                ? 'animate-pulse bg-error/10 text-error'
                : 'bg-surface-hover text-text-muted hover:text-text-primary'
            }`}
          >
            <svg
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          </button>
        </div>
      )}

      {/* Empty result view */}
      {isParsed && editableItems.length === 0 && (
        <div className="py-8 text-center">
          <p className="text-text-muted">{t('noItemsFound')}</p>
          <Button variant="ghost" size="sm" onClick={handleBack} className="mt-3">
            {t('analyze')}
          </Button>
        </div>
      )}

      {/* Items list view */}
      {isParsed && editableItems.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium text-text-secondary">{t('selectItems')}:</p>
          {missingCategoryCount > 0 && (
            <p role="alert" className="mb-3 text-sm text-error">
              {t('missingCategory')}
            </p>
          )}
          <ul role="list" className="max-h-72 space-y-1 overflow-y-auto">
            {editableItems.map((item, idx) => (
              <RecipeImportItemRow
                key={idx}
                item={item}
                idx={idx}
                categories={categories as ICategory[]}
                onFieldChange={handleFieldChange}
                onCategoryChange={handleCategoryChange}
                uncategorizedLabel={t('uncategorizedOption')}
              />
            ))}
          </ul>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <p role="alert" className="mt-3 text-sm text-error">
          {error}
        </p>
      )}

      {/* Footer actions */}
      <div className="mt-5 flex justify-end gap-3">
        <Button variant="ghost" size="sm" onClick={handleClose}>
          {t('cancel')}
        </Button>

        {!isParsed ? (
          <Button onClick={handleAnalyze} disabled={isLoading} loading={isLoading}>
            {isLoading ? t('analyzing') : t('analyze')}
          </Button>
        ) : (
          <>
            {editableItems.length > 0 && (
              <Button variant="outline" size="sm" onClick={handleBack}>
                {t('back')}
              </Button>
            )}
            <Button
              onClick={handleAdd}
              disabled={selectedCount === 0 || missingCategoryCount > 0}
            >
              {t('addItems', { count: selectedCount })}
            </Button>
          </>
        )}
      </div>
    </Modal>
  );
}
