"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "../../i18n/navigation";
import { useTranslations } from "next-intl";
import {
  CheckCircle,
  Clock,
  Search,
  Grid,
  List,
  ShoppingBag,
  Users,
  Package,
} from "lucide-react";
import {
  useGroupShoppingLists,
  useCreateShoppingList,
  useDeleteShoppingList,
} from "../../hooks/useShoppingLists";
import { useGroup } from "../../hooks/useGroups";
import { Card, CardBody, Input, Button, SkeletonCard } from "../../components/common";
import { CreateShoppingListModal } from "../shoppingList/CreateShoppingListModal";
import { useAuthRedirect } from "../../hooks/useAuthRedirect";
import { MetricCard } from "../../components/common/MetricCard";
import { FilterDropdownMenu, ActiveFilterBadges } from "../../components/groups/FilterDropdownMenuList";
import { ShoppingListsDisplay } from "../../components/groups/ShoppingListsDisplay";
import { IShoppingList, ICreateListFormData } from "../../types";
import { DeleteListModal } from "./DeleteListModal";


export function GroupShoppingLists() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations();

  const groupId = params.groupId as string;

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [showDeleteListModal, setShowDeleteListModal] = useState(false);
  const [deletingList, setDeletingList] = useState<{listId: string, listName: string} | null>(null);
  useAuthRedirect({
    redirectTo: '/welcome',
    requireAuth: true,
  });

  const {
    data: group,
    isLoading: groupLoading,
    error: groupError,
  } = useGroup(groupId);
  const {
    data: shoppingLists,
    isLoading: listsLoading,
    error: listsError,
  } = useGroupShoppingLists(groupId);
  const createListMutation = useCreateShoppingList();
  const deleteListMutation = useDeleteShoppingList();


  const getActiveFiltersCount = () => {
    let count = 0;
    if (statusFilter !== "all") count++;
    if (priorityFilter !== "all") count++;
    return count;
  };
  const activeFiltersCount = getActiveFiltersCount();

  const filteredLists = shoppingLists?.filter((list: IShoppingList) => {
    const matchesSearch =
      list.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      list.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || list.status === statusFilter;
    const matchesPriority =
      priorityFilter === "all" || list.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });


  const handleCreateList = async (listData: ICreateListFormData) => {
      await createListMutation.mutateAsync({ groupId, listData });
      setShowCreateModal(false);
  };

  const handleListClick = (listId: string) => {
    router.push(`/groups/${groupId}/${listId}`);
  };

  const handleDeleteList = async (listId: string, listName: string) => {
    setDeletingList({listId, listName});
    setShowDeleteListModal(true);
  };

  const handleConfirmDeleteList = async () => {
    if (deletingList?.listId) {
      await deleteListMutation.mutateAsync({ listId: deletingList.listId, groupId });
      setDeletingList(null);
      setShowDeleteListModal(false);
    }
  };

  const handleClearFilters = () => {
    setStatusFilter("all");
    setPriorityFilter("all");
  }

  const stats = {
    total: shoppingLists?.length || 0,
    active:
      shoppingLists?.filter((list: IShoppingList) => list.status === "active").length || 0,
    completed:
      shoppingLists?.filter((list: IShoppingList) => list.status === "completed").length || 0,
    totalItems:
      shoppingLists?.reduce((total: number, list: IShoppingList) => total + (list.metadata?.itemsCount || 0), 0) || 0,
    completedItems:
      shoppingLists?.reduce((total: number, list: IShoppingList) => total + (list.metadata?.completedItemsCount || 0), 0) || 0,
  };

  if (groupLoading || listsLoading) {
    return (
      <div className="min-h-screen bg-surface">
        <div className="max-w-7xl mx-auto space-y-3 pb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (groupError || listsError) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-4">
        <Card variant="glass" className="bg-card border border-border shadow-2xl max-w-md">
          <CardBody className="p-6 text-center">
            <h3 className="text-lg font-bold text-text-primary mb-2">
              {t("lists.loadError")}
            </h3>
            <Button
              variant="primary"
              onClick={() => router.push('/groups')}
              className="w-full"
            >
              {t("navigation.backToGroups")}
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }


  return (
    <div>
      <div className="max-w-7xl mx-auto space-y-3 pb-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            placeholder={t("lists.searchPlaceholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            fullWidth
            variant="outlined"
            icon={<Search className="w-4 h-4" />}
          />
          <div className="gap-1 hidden sm:flex">
            <Button
              variant={viewMode === "grid" ? "primary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "primary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {
            shoppingLists?.length > 0 && (
              <FilterDropdownMenu
                t={t}
                statusFilter={statusFilter}
                priorityFilter={priorityFilter}
                setStatusFilter={setStatusFilter}
                setPriorityFilter={setPriorityFilter}
                isOpen={isFilterDropdownOpen}
                setIsOpen={setIsFilterDropdownOpen}
                activeFiltersCount={activeFiltersCount}
              />
            )
          }
          

          {(statusFilter !== "all" || priorityFilter !== "all") && (
            <ActiveFilterBadges
                t={t}
                statusFilter={statusFilter}
                priorityFilter={priorityFilter}
                setStatusFilter={setStatusFilter}
                setPriorityFilter={setPriorityFilter}
                handleClearAll={handleClearFilters}
            />
          )}
        </div>

        <ShoppingListsDisplay
            filteredLists={filteredLists}
            viewMode={viewMode}
            searchTerm={searchTerm}
            t={t}
            group={group}
            handleListClick={handleListClick}
            handleDeleteList={handleDeleteList}
            setShowCreateModal={setShowCreateModal}
            activeFiltersCount={activeFiltersCount}
        />
      </div>
      {showDeleteListModal && (
        <DeleteListModal
          isOpen={showDeleteListModal}
          onClose={() => setShowDeleteListModal(false)}
          onDelete={handleConfirmDeleteList}
          isDeleting={deleteListMutation.isPending}
          listName={deletingList?.listName || ""}
        />
      )}
      <MetricsBar
        metrics={{
          addedItems: stats.totalItems,
          members: group?.members?.length || 0,
          completedLists: stats.completed,
          activeLists: stats.active,
          totalLists: stats.total,
        }}
        t={t}
      />


      {showCreateModal && (
        <CreateShoppingListModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateList}
          groupId={groupId}
          groupName={group?.name}
        />
      )}
    </div>
  );
}


const MetricsBar = ({
  metrics,
  t,
}: {
  metrics: {
    addedItems: number;
    members: number;
    completedLists: number;
    activeLists: number;
    totalLists: number;
  };
  t: ReturnType<typeof useTranslations>;
}) => {
  const metricsLabels = [
    {
      id: "activeLists",
      icon: <Clock size={20} className="text-primary-600" />,
      value: metrics.activeLists,
      label: t("lists.activeLists"),
      bgColor: "bg-primary-400",
    },
    {
      id: "totalLists",
      icon: <ShoppingBag size={20} className="text-warning-600" />,
      value: metrics.totalLists,
      label: t("lists.totalLists"),
      bgColor: "bg-warning-400",
    },
    {
      id: "addedItems",
      icon: <Package size={20} className="text-info-600" />,
      value: metrics.addedItems,
      label: t("lists.addedItems"),
      bgColor: "bg-info-400",
    },
    {
      id: "members",
      icon: <Users size={20} className="text-accent-500" />,
      value: metrics.members,
      label: t("lists.members"),
      bgColor: "bg-accent-400",
    },
    {
      id: "completedLists",
      icon: <CheckCircle size={20} className="text-success-600" />,
      value: metrics.completedLists,
      label: t("lists.completedLists"),
      bgColor: "bg-success-400",
    },

  ] as const;
  return (
  <div className="bg-card border border-border rounded-xl shadow-sm p-6 grid grid-cols-2 md:grid-cols-5 gap-4">
    {metricsLabels.map((metric) => (
      <MetricCard
        key={metric.id}
        icon={metric.icon}
        value={metric.value}
        label={metric.label}
        bgColor={metric.bgColor}
      />
    ))}
  </div>
);
}
