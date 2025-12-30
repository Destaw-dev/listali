'use client';

import React, { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useQueryClient } from '@tanstack/react-query';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ShoppingListHeaderBar } from '@/components/shoppingList/ShoppingListHeaderBar';
import { ShoppingListStats } from '@/components/shoppingList/ShoppingListStats';
import { ShoppingListFilters, ShoppingStatusFilter } from '@/components/shoppingList/ShoppingListFilters';
import { ShoppingListItems } from '@/components/shoppingList/ShoppingListItems';
import AddItemsModal from '@/components/shoppingList/AddItemsModal';
import { useShoppingListData } from '@/hooks/useShoppingListData';
import { useShoppingListWebSocket } from '@/hooks/useShoppingListWebSocket';
import { useCreateMultipleItems } from '@/hooks/useItems';
import { useAvailableCategories } from '@/hooks/useItems';
import { useAuthRedirect } from '@/hooks/useAuthRedirect';
import { ShoppingModeCard } from '@/components/shoppingList/ShoppingModeCard';
import { ICategory, IItem, IGroupMember, ItemInput } from '@/types';
import { useGroup } from '@/hooks/useGroups';
import { useAuthStore } from '@/store/authStore';
import { useUpdateItem } from '@/hooks/useItems';

export default function ShoppingListPage() {
  const params = useParams();
  const locale = params?.locale as string || 'he';
  const groupId = params?.groupId as string;
  const listId = params?.listId as string;
  const t = useTranslations('ShoppingListPage');

  const { isInitialized } = useAuthRedirect({
    redirectTo: `/${locale}/welcome`,
    requireAuth: true
  });

  const {
    shoppingList,
    items,
    shoppingSession,
    isLoading,
    error,
    purchasedItems,
    totalItems,
  } = useShoppingListData(listId);

  const { data: group } = useGroup(groupId);
  const { user } = useAuthStore();

  useShoppingListWebSocket(listId, groupId);

  const [statusFilter, setStatusFilter] = useState<ShoppingStatusFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showAddItemsModal, setShowAddItemsModal] = useState(false);

  const { data: categories = [] } = useAvailableCategories();

  const createItemsMutation = useCreateMultipleItems();
  const updateItemMutation = useUpdateItem();

  const activeShoppers = shoppingSession?.activeSessions?.length || 0;

  const filteredItems = useMemo(() => {
    if (!items || items.length === 0) return [];

    let filtered = [...items];

    if (statusFilter === 'purchased') {
      filtered = filtered.filter((item: IItem) => item.isPurchased || item.status === 'purchased');
    } else if (statusFilter === 'unpurchased') {
      filtered = filtered.filter((item: IItem) => !item.isPurchased && item.status !== 'purchased');
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter((item: IItem) => {
        const itemCategoryId = item.category;
        return itemCategoryId === categoryFilter;
      });
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((item: IItem) => {
        const name = (item.name || '').toLowerCase();
        const brand = (item.brand || '').toLowerCase();
        const notes = (item.notes || '').toLowerCase();
        return name.includes(query) || brand.includes(query) || notes.includes(query);
      });
    }

    return filtered;
  }, [items, statusFilter, categoryFilter, searchQuery]);

  const categoryStats = useMemo(() => {
    const stats: Record<string, { id: string; name: string; count: number }> = {};
    
    items?.forEach((item: IItem) => {
      let categoryId: string;
      if (typeof item.category === 'string') {
        categoryId = item.category;
      } else if (item.category && typeof item.category === 'object') {
        categoryId = '_id' in item.category ? item.category._id : 'no-category';
      } else {
        categoryId = 'no-category';
      }
      const categoryName = categories.find((c: ICategory) => c._id === categoryId)?.name || 'No Category';
      
      const categoryKey = String(categoryId);
      
      if (!stats[categoryKey]) {
        stats[categoryKey] = {
          id: categoryKey,
          name: categoryName,
          count: 0,
        };
      }
      stats[categoryKey].count++;
    });

    return Object.values(stats);
  }, [items, categories]);

  const purchasedCount = useMemo(() => {
    return items?.filter((item: IItem) => item.isPurchased || item.status === 'purchased').length || 0;
  }, [items]);

  const unpurchasedCount = useMemo(() => {
    return items?.filter((item: IItem) => !item.isPurchased && item.status !== 'purchased').length || 0;
  }, [items]);

  const queryClient = useQueryClient();

  const handleAddItems = async (itemsData: ItemInput[]) => {
      const itemsWithListId = itemsData.map(item => ({
        ...item,
        shoppingListId: listId,
        name: (item.name || '').trim().replace(/\s+/g, ' '),
      }));

      if (itemsWithListId.length > 0) {
        await createItemsMutation.mutateAsync(itemsWithListId);
      }
      setShowAddItemsModal(false);
      return true;
  };

  const handleMergeDuplicateFromSidebar = async (existingItemId: string, newQuantity: number) => {
      await updateItemMutation.mutateAsync({
        itemId: existingItemId,
        itemData: { quantity: newQuantity },
      });
      await queryClient.refetchQueries({ queryKey: ['shopping-lists', 'full-data', listId] });
  };


  const getMemberUserId = (member: IGroupMember): string => {
    return typeof member.user === "object" ? member.user.id : member.userId;
  };

  const currentUserMembership = useMemo(() => {
    if (!group?.members || !user?._id) return undefined;
    return group.members.find((member: IGroupMember) => getMemberUserId(member) === user._id);
  }, [group?.members, user?._id]);

  const canEdit = useMemo(() => {
    if (!currentUserMembership) return false;
    return currentUserMembership.permissions?.canEditLists ?? false;
  }, [currentUserMembership]);

  const canDelete = useMemo(() => {
    return !!currentUserMembership;
  }, [currentUserMembership]);


  if (!isInitialized || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !shoppingList) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-text-primary mb-2">
            {t('errorLoadingList')}
          </h2>
          <p className="text-text-muted">{error?.message || 'Shopping list not found'}</p>
        </div>
      </div>
    );
  }
  

  return (
    <div className="bg-surface">
      
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <ShoppingListHeaderBar
        shoppingList={shoppingList}
        groupId={groupId}
        locale={locale}
        onAddItems={() => setShowAddItemsModal(true)}
      />

      <ShoppingListStats
        totalItems={totalItems}
        purchasedItems={purchasedItems}
        activeShoppers={activeShoppers}
      />

      <ShoppingModeCard
        listId={listId}
        groupId={groupId}
        shoppingSession={shoppingSession || undefined}
        totalItems={totalItems}
        purchasedItems={purchasedItems}
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

      <ShoppingListItems
        items={filteredItems}
        listId={listId}
        groupId={groupId}
        loading={isLoading}
        canEdit={canEdit}
        canDelete={canDelete}
      />

      <AddItemsModal
        isOpen={showAddItemsModal}
        onClose={() => {
          setShowAddItemsModal(false);
        }}
        onSubmit={handleAddItems}
        listId={listId}
        existingItems={items}
        onMergeDuplicate={handleMergeDuplicateFromSidebar}
      />
    </div>
    </div>
  );
}
