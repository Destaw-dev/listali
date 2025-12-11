'use client';

import React, { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
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
import { ICategory, IItem, IItemCategory } from '@/types';

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

  // Fetch shopping list data
  const {
    shoppingList,
    items,
    shoppingSession,
    isLoading,
    error,
    purchasedItems,
    totalItems,
  } = useShoppingListData(listId, groupId);

  // Real-time updates via WebSocket
  useShoppingListWebSocket(listId, groupId);

  // State for filters
  const [statusFilter, setStatusFilter] = useState<ShoppingStatusFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showAddItemsModal, setShowAddItemsModal] = useState(false);

  // Get categories for filter
  const { data: categories = [] } = useAvailableCategories();

  // Create items mutation
  const createItemsMutation = useCreateMultipleItems();

  // Get active shoppers count
  const activeShoppers = shoppingSession?.activeSessions?.length || 0;

  // Filter items based on status, category, and search query
  const filteredItems = useMemo(() => {
    if (!items || items.length === 0) return [];

    let filtered = [...items];

    // Filter by status
    if (statusFilter === 'purchased') {
      filtered = filtered.filter((item: IItem) => item.isPurchased || item.status === 'purchased');
    } else if (statusFilter === 'unpurchased') {
      filtered = filtered.filter((item: IItem) => !item.isPurchased && item.status !== 'purchased');
    }

    // Filter by category
    if (categoryFilter !== 'all') {
      filtered = filtered.filter((item: IItem) => {
        const itemCategoryId = item.category;
        return itemCategoryId === categoryFilter;
      });
    }

    // Filter by search query
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

  // Calculate category stats
  const categoryStats = useMemo(() => {
    const stats: Record<string, { id: string; name: string; count: number }> = {};
    
    items?.forEach((item: IItem) => {
      const categoryId = item.category || 'no-category';
      const categoryName = categories.find((c: ICategory) => c._id === categoryId)?.name || 'No Category';
      
      if (!stats[categoryId]) {
        stats[categoryId] = {
          id: categoryId,
          name: categoryName,
          count: 0,
        };
      }
      stats[categoryId].count++;
    });

    return Object.values(stats);
  }, [items, categories]);

  // Calculate purchased/unpurchased counts
  const purchasedCount = useMemo(() => {
    return items?.filter((item: IItem) => item.isPurchased || item.status === 'purchased').length || 0;
  }, [items]);

  const unpurchasedCount = useMemo(() => {
    return items?.filter((item: IItem) => !item.isPurchased && item.status !== 'purchased').length || 0;
  }, [items]);

  // Handle add items
  const handleAddItems = async (itemsData: any[]) => {
    try {
      const itemsWithListId = itemsData.map(item => ({
        ...item,
        shoppingListId: listId,
      }));
      await createItemsMutation.mutateAsync(itemsWithListId);
      setShowAddItemsModal(false);
    } catch (error) {
      // Error handled by mutation
    }
  };

  // Handle edit item (placeholder - implement as needed)
  const handleEditItem = (item: any) => {
    // TODO: Implement edit item functionality
    console.log('Edit item:', item);
  };

  // Loading state
  if (!isInitialized || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // Error state
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
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <ShoppingListHeaderBar
        shoppingList={shoppingList}
        groupId={groupId}
        locale={locale}
        onAddItems={() => setShowAddItemsModal(true)}
      />

      {/* Stats */}
      <ShoppingListStats
        totalItems={totalItems}
        purchasedItems={purchasedItems}
        activeShoppers={activeShoppers}
      />

      <ShoppingModeCard
        listId={listId}
        groupId={groupId}
        shoppingSession={shoppingSession}
        totalItems={totalItems}
        purchasedItems={purchasedItems}
      />

      {/* Filters */}
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

      {/* Items */}
      <ShoppingListItems
        items={filteredItems}
        listId={listId}
        groupId={groupId}
        loading={isLoading}
        onEditItem={handleEditItem}
      />

      {/* Add Items Modal */}
      <AddItemsModal
        isOpen={showAddItemsModal}
        onClose={() => setShowAddItemsModal(false)}
        onSubmit={handleAddItems}
        listId={listId}
      />
    </div>
  );
}


// interface ShoppingItem {
//   id: number;
//   name: string;
//   details: string; // e.g., "500 גרם, 1 יחידות"
//   status: 'to-buy' | 'bought';
//   category: string;
//   image: string; // URL or path
//   requestedBy: string; // User ID/Name
// }

// interface StatusMetric {
//   title: string;
//   value: number | string;
//   icon: React.ElementType; // For the icon component
//   primaryColor: string;
// }

// import React from 'react';
// import {
//   ShoppingCart, 
//   Edit,
//   Trash2,
//   Plus,
//   List,
//   Calendar,
//   Users,
//   AlertTriangle,
//   CheckCircle
// } from 'lucide-react';

// // --- Type Definitions (assuming they are imported or defined here) ---
// interface ShoppingItem {
//   id: number;
//   name: string;
//   details: string; // e.g., "500 גרם, 1 יחידות"
//   status: 'to-buy' | 'bought';
//   category: string;
//   image: string; // Placeholder URL
//   requestedBy: string; // Placeholder User ID/Name
// }

// interface StatusMetric {
//   title: string;
//   value: number | string;
//   icon: React.ElementType;
//   primaryColor: string;
// }
// // -------------------------------------------------------------------

// const mockItems: ShoppingItem[] = [
//   { id: 1, name: 'אבקת כביסה - 400 מ"ל', details: 'אריזה גדולה, 1 יחידות', status: 'to-buy', category: 'ניקיון', image: 'url-1', requestedBy: 'user-a' },
//   { id: 2, name: 'בננות - 1 ק"ג', details: 'בשלות, 2 יחידות', status: 'to-buy', category: 'פירות', image: 'url-2', requestedBy: 'user-b' },
//   { id: 3, name: 'חלב 3% - 1 ליטר', details: 'תאריך ארוך, 3 יחידות', status: 'bought', category: 'חלב', image: 'url-3', requestedBy: 'user-a' },
// ];

// const metrics: StatusMetric[] = [
//   { title: 'פריטים לרכישה', value: 2, icon: List, primaryColor: 'text-red-500' },
//   { title: 'משתתפים פעילים', value: 3, icon: Users, primaryColor: 'text-blue-500' },
//   { title: 'רכישות אחרונות', value: 4, icon: Calendar, primaryColor: 'text-purple-500' },
// ];

// // --- Sub-Components ---

// // 1. Progress Ring Component
// const ProgressRing: React.FC<{ progress: number }> = ({ progress }) => {
//   const radius = 50;
//   const stroke = 8;
//   const normalizedRadius = radius - stroke / 2;
//   const circumference = normalizedRadius * 2 * Math.PI;
//   const strokeDashoffset = circumference - (progress / 100) * circumference;

//   return (
//     <div className="relative h-24 w-24">
//       <svg height={radius * 2} width={radius * 2} className="rotate-90">
//         <circle
//           stroke="currentColor"
//           fill="transparent"
//           strokeWidth={stroke}
//           strokeDasharray={circumference + ' ' + circumference}
//           style={{ strokeDashoffset }}
//           r={normalizedRadius}
//           cx={radius}
//           cy={radius}
//           className="text-gray-200"
//         />
//         <circle
//           stroke="currentColor"
//           fill="transparent"
//           strokeWidth={stroke}
//           strokeDasharray={circumference + ' ' + circumference}
//           style={{ strokeDashoffset: circumference - (progress / 100) * circumference }}
//           r={normalizedRadius}
//           cx={radius}
//           cy={radius}
//           className="text-teal-500 transition-all duration-700"
//         />
//       </svg>
//       <div className="absolute inset-0 flex items-center justify-center">
//         <span className="text-2xl font-bold text-gray-700">{progress}%</span>
//       </div>
//     </div>
//   );
// };

// // 2. Status Card Component
// const StatusCard: React.FC<{ metric: StatusMetric }> = ({ metric }) => {
//   const Icon = metric.icon;
//   return (
//     <div className="flex flex-col items-center justify-center p-4 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
//       <Icon className={`w-8 h-8 ${metric.primaryColor}`} />
//       <div className="mt-2 text-3xl font-bold text-gray-800">{metric.value}</div>
//       <div className="text-sm text-gray-500">{metric.title}</div>
//     </div>
//   );
// };

// // 3. Shopping Item Card
// const ShoppingItemCard: React.FC<{ item: ShoppingItem }> = ({ item }) => {
//   const isBought = item.status === 'bought';
//   const bgColor = isBought ? 'bg-green-50' : 'bg-white';
//   const ringColor = isBought ? 'ring-green-300' : 'ring-gray-200';
//   const nameStyle = isBought ? 'line-through text-gray-500' : 'text-gray-800';

//   return (
//     <div
//       className={`relative flex items-center p-4 my-3 rounded-lg shadow-sm border ring-2 ${ringColor} ${bgColor} transition-all duration-200`}
//       dir="rtl" // Ensure RTL layout for the card
//     >
//       {/* Drag Handle */}
//       <div className="ml-4 cursor-grab text-gray-400 hover:text-gray-600">
//         <List className="w-5 h-5" />
//       </div>

//       {/* Image & Status Check */}
//       <div className="relative flex-shrink-0 w-16 h-16 rounded-lg bg-gray-200 ml-4 overflow-hidden">
//         {/* Placeholder for Product Image */}
//         <div className="flex items-center justify-center w-full h-full text-gray-500 text-xs">
//           {item.category}
//         </div>
//         {isBought && (
//           <div className="absolute top-0 left-0 p-1 bg-green-500 rounded-br-lg">
//             <CheckCircle className="text-white w-4 h-4" />
//           </div>
//         )}
//       </div>

//       {/* Item Details */}
//       <div className="flex-grow">
//         <div className={`text-lg font-bold ${nameStyle}`}>{item.name}</div>
//         <div className="text-sm text-gray-500">{item.details}</div>
//         <div className="mt-1 text-xs text-gray-400">
//           נוסף על ידי: **{item.requestedBy}**
//         </div>
//       </div>

//       {/* Actions (Left Side) */}
//       <div className="flex items-center space-x-2 space-x-reverse mr-4">
//         <button
//           className={`p-2 rounded-full text-white transition-colors ${
//             isBought ? 'bg-gray-400 cursor-not-allowed' : 'bg-teal-500 hover:bg-teal-600'
//           }`}
//           disabled={isBought}
//           title="הוספה לסל קניות"
//         >
//           <ShoppingCart className="w-5 h-5" />
//         </button>
//         <button className="p-2 text-blue-500 hover:text-blue-700 transition-colors" title="עריכה">
//           <Edit className="w-5 h-5" />
//         </button>
//         <button className="p-2 text-red-500 hover:text-red-700 transition-colors" title="מחיקה">
//           <Trash2 className="w-5 h-5" />
//         </button>
//       </div>
//     </div>
//   );
// };

// // --- Main Component ---
// const ShoppingListPage: React.FC = () => {
//   const itemsToBuy = mockItems.filter(item => item.status === 'to-buy');
//   const itemsBought = mockItems.filter(item => item.status === 'bought');
//   const progressPercentage = Math.round((itemsBought.length / mockItems.length) * 100) || 0;

//   return (
//     <div className="min-h-screen bg-gray-50 p-4 sm:p-8" dir="rtl">
//       {/* --- Page Header & Group Info --- */}
//       <header className="flex items-center justify-between border-b pb-4 mb-6">
//         <h1 className="text-3xl font-extrabold text-gray-800 flex items-center">
//           <img src="placeholder-avatar.png" alt="Group Avatar" className="w-10 h-10 rounded-full ml-3" />
//           בדיקת יצירת קבוצה
//         </h1>
//         <button className="flex items-center px-4 py-2 bg-teal-500 text-white font-medium rounded-full shadow-lg hover:bg-teal-600 transition-colors">
//           <Plus className="w-5 h-5 ml-2" />
//           הוסף פריט חדש
//         </button>
//       </header>

//       {/* --- Status Dashboard (Improved Layout) --- */}
//       <div className="bg-white p-6 rounded-xl shadow-lg mb-8">
//         <h2 className="text-xl font-semibold mb-4 text-gray-700 border-b pb-2">🎯 סטטוס קבוצתי</h2>
//         <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-center">
//           {/* Progress Ring (Highlight) */}
//           <div className="flex flex-col items-center col-span-1 md:col-span-1 border-l-2 border-gray-100 pl-4">
//             <ProgressRing progress={progressPercentage} />
//             <p className="mt-3 text-sm font-medium text-teal-600">התקדמות רכישה</p>
//           </div>

//           {/* Key Metrics */}
//           <div className="grid grid-cols-3 gap-6 col-span-1 md:col-span-3">
//             {metrics.map((metric) => (
//               <StatusCard key={metric.title} metric={metric} />
//             ))}
//           </div>
          
//           {/* Action/Summary Block */}
//           <div className="col-span-1 md:col-span-1 flex flex-col items-center justify-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
//             <AlertTriangle className="w-6 h-6 text-yellow-600 mb-2" />
//             <p className="text-sm font-medium text-gray-700 text-center">
//               **3** פריטים דורשים בדיקה חוזרת או אישור
//             </p>
//           </div>
//         </div>
//       </div>

//       {/* --- Shopping List Filters and Search --- */}
//       <div className="flex flex-col sm:flex-row justify-between items-center mb-6 space-y-4 sm:space-y-0">
//         <div className="relative w-full sm:w-1/2">
//           <input
//             type="text"
//             placeholder="🔍 חפש פריטים או קטגוריות..."
//             className="w-full p-3 pr-10 border border-gray-300 rounded-full focus:ring-teal-500 focus:border-teal-500 text-right"
//             dir="rtl"
//           />
//         </div>
//         <div className="flex space-x-3 space-x-reverse text-sm">
//           <button className="px-3 py-1 border border-teal-500 text-teal-500 rounded-full hover:bg-teal-50">
//             כל הקטגוריות
//           </button>
//           <button className="px-3 py-1 bg-teal-500 text-white rounded-full hover:bg-teal-600 shadow-sm">
//             לא נקנו (2)
//           </button>
//           <button className="px-3 py-1 border border-gray-300 text-gray-600 rounded-full hover:bg-gray-100">
//             נקנו (1)
//           </button>
//         </div>
//       </div>

//       {/* --- Shopping List Content --- */}
//       <div className="space-y-6">
//         {/* Section 1: To Buy (Primary Focus) */}
//         <h2 className="text-2xl font-bold text-gray-800 border-b-2 border-teal-500 pb-2">
//           🛍️ פריטים לרכישה מיידית ({itemsToBuy.length})
//         </h2>
//         <div>
//           {itemsToBuy.length > 0 ? (
//             itemsToBuy.map((item: ShoppingItem) => (
//               <ShoppingItemCard key={item.id} item={item} />
//             ))
//           ) : (
//             <div className="text-center p-8 bg-white rounded-xl text-gray-500">
//               כל הכבוד! אין כרגע פריטים לרכישה.
//             </div>
//           )}
//         </div>

//         {/* Section 2: Already Bought (Secondary Focus) */}
//         <h2 className="text-xl font-bold text-gray-600 border-b border-gray-300 pt-4 pb-2">
//           ✅ פריטים שנרכשו ({itemsBought.length})
//         </h2>
//         <div>
//           {itemsBought.map((item: ShoppingItem) => (
//             <ShoppingItemCard key={item.id} item={item} />
//           ))}
//         </div>
//       </div>

//     </div>
//   );
// };

// export default ShoppingListPage;