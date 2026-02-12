'use client';

import { useState, useMemo, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from '../../../../i18n/navigation';
import { useTranslations } from 'next-intl';
import { LoadingSpinner } from '../../../../components/common';
import { useGuestListsStore } from '../../../../store/guestListsStore';
import { useAuthStore } from '../../../../store/authStore';
import { useAuthRedirect } from '../../../../hooks/useAuthRedirect';
import { GUEST_LIMITS } from '../../../../constants/guestLimits';
import { apiClient } from '../../../../lib/api';
import type { GuestItem, ICategory } from '../../../../types';
import AddItemsModal from '@/components/shoppingList/AddItemsModal';
import { GuestListHeaderBar } from '../../../../components/guestList/GuestListHeaderBar';
import { ShoppingListStats } from '../../../../components/shoppingList/ShoppingListStats';
import { ShoppingListFilters, ShoppingStatusFilter } from '../../../../components/shoppingList/ShoppingListFilters';
import { GuestListItems } from '../../../../components/guestList/GuestListItems';

export default function GuestListPage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations('GuestListPage');
  const locale = params?.locale as string || 'he';
  const listId = params?.listId as string;
  
  const { isGuest } = useAuthStore();
  const { getList, addItem, removeItem, purchaseItem, unpurchaseItem, purchaseAllItems, undoPurchaseAll } = useGuestListsStore();
  
  const { safeToShow } = useAuthRedirect({
    redirectTo: '/welcome',
    requireAuth: false
  });

  const guestList = getList(listId);
  const [statusFilter, setStatusFilter] = useState<ShoppingStatusFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddItemsModal, setShowAddItemsModal] = useState(false);
  const [categories, setCategories] = useState<ICategory[]>([]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await apiClient.getAvailableCategories();
        if (response?.data) {
          setCategories(response.data);
        }
      } catch (error) {
        console.error('Failed to load categories:', error);
      } finally {

      }
    };

    loadCategories();
  }, []);

  // All hooks must be called before any early returns
  const filteredItems = useMemo(() => {
    if (!guestList?.items || guestList.items.length === 0) return [];

    let filtered = [...guestList.items];

    if (statusFilter === 'purchased') {
      filtered = filtered.filter((item: GuestItem) => item.checked);
    } else if (statusFilter === 'unpurchased') {
      filtered = filtered.filter((item: GuestItem) => !item.checked);
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter((item: GuestItem) => {
        return item.categoryId === categoryFilter;
      });
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((item: GuestItem) =>
        item.name.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [guestList?.items, statusFilter, categoryFilter, searchQuery]);

  const checkedItems = guestList?.items?.filter(item => item.checked).length || 0;
  const totalItems = guestList?.items?.length || 0;
  const remainingItems = totalItems - checkedItems;

  const categoryStats = useMemo(() => {
    if (!guestList?.items) return [];
    
    const stats: Record<string, { id: string; name: string; count: number }> = {};
    
    guestList.items.forEach((item: GuestItem) => {
      if (item.categoryId) {
        const category = categories.find((c: ICategory) => c._id === item.categoryId);
        const categoryName = category?.name || 'No Category';
        const categoryKey = item.categoryId;
        
        if (!stats[categoryKey]) {
          stats[categoryKey] = {
            id: categoryKey,
            name: categoryName,
            count: 0,
          };
        }
        stats[categoryKey].count++;
      }
    });

    return Object.values(stats);
  }, [guestList?.items, categories]);

  useEffect(() => {
    if (safeToShow && (!isGuest() || !guestList)) {
      router.push('/dashboard');
    }
  }, [safeToShow, isGuest, guestList, locale, router]);

  if (!safeToShow) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!isGuest() || !guestList) {
    return null;
  }

  const purchasedCount = checkedItems;
  const unpurchasedCount = remainingItems;

  const handleAddItems = async (itemsData: Array<{ name: string; quantity: number; unit: string; category?: string, brand?: string, image?: string, notes?: string, product?: string }>) => {
    const itemsCount = guestList.items.length;
    const newItemsCount = itemsData.length;
    
    if (itemsCount + newItemsCount > GUEST_LIMITS.MAX_ITEMS_PER_LIST) {
      alert(t('maxItemsPerList', { count: GUEST_LIMITS.MAX_ITEMS_PER_LIST }) || `מקסימום ${GUEST_LIMITS.MAX_ITEMS_PER_LIST} פריטים לרשימה`);
      return false;
    }
    
    if (itemsCount + newItemsCount >= GUEST_LIMITS.MAX_ITEMS_WARNING) {
      const confirm = window.confirm(
        t('maxItemsPerListWarning', { count: GUEST_LIMITS.MAX_ITEMS_PER_LIST }) || `אתה קרוב למגבלה! מקסימום ${GUEST_LIMITS.MAX_ITEMS_PER_LIST} פריטים. האם להמשיך?`
      );
      if (!confirm) return false;
    }
    
    try {
      const existingItemsForCheck = guestList.items.map(item => ({
        _id: item.id,
        name: item.name,
        unit: item.unit || 'piece',
        category: item.categoryId || undefined,
        status: item.checked ? 'purchased' : 'pending',
      }));

      for (const item of itemsData) {
        const itemName = item.name.trim().toLowerCase();
        const itemUnit = item.unit || 'piece';
        const itemCategory = item.category || undefined;
        
        const existingItem = existingItemsForCheck.find(existing => {
          const existingName = (existing.name || '').trim().toLowerCase();
          const existingUnit = existing.unit || 'piece';
          const existingCategory = existing.category;
          return existingName === itemName && existingUnit === itemUnit && existingCategory === itemCategory && existing.status !== 'cancelled';
        });

        if (existingItem) {
          const shouldMerge = window.confirm(
            t('duplicateItemFound', { name: item.name }) || `הפריט "${item.name}" כבר קיים ברשימה. האם להוסיף בכל זאת?`
          );
          if (!shouldMerge) continue;
        }

        console.log('item', item);
        addItem(
          listId,
          item.name.trim(),
          item.quantity || 1,
          item.unit || 'piece',
          item.category || undefined,
          item.brand || undefined,
          item.image || undefined,
          item.notes || undefined,
          item.product || undefined
        );
      }
      setShowAddItemsModal(false);
      return true;
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message);
      }
      return false;
    }
  };

  const handlePurchaseItem = (itemId: string, quantity: number) => {
    purchaseItem(listId, itemId, quantity);
  };

  const handleUnpurchaseItem = (itemId: string, quantity: number) => {
    unpurchaseItem(listId, itemId, quantity);
  };

  const handleDeleteItem = (itemId: string) => {
    if (confirm(t('deleteItemConfirmation') || 'האם אתה בטוח שברצונך למחוק את הפריט?')) {
      removeItem(listId, itemId);
    }
  };

  return (
    <div className="bg-surface">
      <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
        <GuestListHeaderBar
          guestList={guestList}
          locale={locale}
          onAddItems={() => setShowAddItemsModal(true)}
        />

        <ShoppingListStats
          totalItems={totalItems}
          purchasedItems={checkedItems}
          activeShoppers={0}
        />

        <ShoppingListFilters
          status={statusFilter}
          onStatusChange={setStatusFilter}
          category={categoryFilter}
          onCategoryChange={setCategoryFilter}
          categories={categoryStats}
          totalItems={totalItems}
          purchasedCount={purchasedCount}
          unpurchasedCount={unpurchasedCount}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        <GuestListItems
          items={filteredItems}
          listId={listId}
          onDelete={handleDeleteItem}
          onPurchase={handlePurchaseItem}
          onUnpurchase={handleUnpurchaseItem}
          onPurchaseAll={() => purchaseAllItems(listId)}
          onUndoPurchaseAll={(previousStates) => undoPurchaseAll(listId, previousStates)}
          categories={categories}
        />

        <AddItemsModal
          isOpen={showAddItemsModal}
          onClose={() => setShowAddItemsModal(false)}
          onSubmit={handleAddItems}
          listId={listId}
        />
      </div>
    </div>
  );
}
