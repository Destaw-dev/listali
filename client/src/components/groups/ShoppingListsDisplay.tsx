import React from "react";
import { Card, CardBody, CardHeader } from "../common";
import {
  Calendar,
  CheckCircle,
  Clock,
  ShoppingCart,
  Tag,
  User,
  Users,
  Archive,
  AlertTriangle,
  Plus,
  Trash,
} from "lucide-react";
import { Button, Badge } from "../common";
import { useTranslations } from "next-intl";
import { IShoppingList, IGroup, getCreatedByFullName } from "../../types";

interface ShoppingListsDisplayProps {
  filteredLists: IShoppingList[] | undefined;
  viewMode: "grid" | "list";
  searchTerm: string;
  t: ReturnType<typeof useTranslations>;
  group: IGroup; 
  handleListClick: (listId: string) => void;
  handleDeleteList: (listId: string, listName: string) => Promise<void>;
  setShowCreateModal: (show: boolean) => void;
  activeFiltersCount: number;
}

export function ShoppingListsDisplay({
  filteredLists,
  viewMode,
  searchTerm,
  t,
  group,
  handleListClick,
  handleDeleteList,
  setShowCreateModal,
  activeFiltersCount,
}: ShoppingListsDisplayProps) {
  const GridClasses =
    "grid gap-2 sm:gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";
  const ListClasses = "space-y-2 sm:space-y-3";

  if (filteredLists?.length === 0) {
    return (
      <Card className="shadow-lg">
        <CardBody className="p-8 text-center">
          <ShoppingCart className="w-12 h-12 text-text-muted mx-auto mb-4" />
          <h3 className="text-lg font-bold text-text-primary mb-2">
            {searchTerm || activeFiltersCount > 0 ? t("lists.noResults") : t("lists.noLists")}
          </h3>
          <p className="text-text-muted mb-4">
            {searchTerm || activeFiltersCount > 0 ? t("lists.noResultsDesc") : t("lists.createFirst")}
          </p>
          <Button
            variant="primary"
            onClick={() => setShowCreateModal(true)}
            icon={<Plus className="w-4 h-4" />}
          >
            {t("lists.createNew")}
          </Button>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className={viewMode === "grid" ? GridClasses : ListClasses}>
      {filteredLists?.map((list: IShoppingList) => (
        <ShoppingListCard
          key={list._id}
          list={list}
          viewMode={viewMode}
          group={group}
          t={t}
          handleListClick={handleListClick}
          handleDeleteList={handleDeleteList}
        />
      ))}
      <Button variant="dashed" onClick={() => setShowCreateModal(true)}>
        <div className="flex items-center flex-col">
        <div className="h-12 w-12 rounded-full bg-card border border-border flex items-center justify-center mb-3">
          <Plus className="h-6 w-6 text-text-primary" />
        </div>
        <span className="text-sm font-medium">{t("lists.createNew")}</span>
        </div>
      </Button>
    </div>
  );
}

interface ShoppingListCardProps {
  list: IShoppingList; 
  viewMode: "grid" | "list";
  group: IGroup; 
  t: ReturnType<typeof useTranslations>;
  handleListClick: (listId: string) => void;
  handleDeleteList: (listId: string, listName: string) => Promise<void>;
}

function ShoppingListCard({
  list,
  group,
  t,
  handleDeleteList,
  handleListClick,
}: ShoppingListCardProps) {

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <Clock className="w-4 h-4 text-primary-500" />;
      case "completed":
        return <CheckCircle className="w-4 h-4 text-success-500" />;
      case "archived":
        return <Archive className="w-4 h-4 text-text-muted" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-warning-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "active":
        return t("lists.status.active");
      case "completed":
        return t("lists.status.completed");
      case "archived":
        return t("lists.status.archived");
      default:
        return t("lists.status.unknown");
    }
  };

  const getPriorityVariant = (priority: string) => {
    switch (priority) {
      case "high":
        return "error";
      case "medium":
        return "warning";
      case "low":
        return "success";
      default:
        return "default";
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case "high":
        return t("lists.high");
      case "medium":
        return t("lists.medium");
      case "low":
        return t("lists.low");
      default:
        return t("lists.undefined");
    }
  };

  const completionPercent =
    list.metadata?.itemsCount > 0
      ? Math.round(
          (list.metadata.completedItemsCount / list.metadata.itemsCount) * 100
        )
      : 0;

  return (
    <Card
      hover
      padding="none"
      className="shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center flex-col gap-2">
            <span
              className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${
                list.status === "active"
                  ? "bg-primary-50 text-primary-700"
                  : "bg-success-50 text-success-700"
              }`}
            >
              {getStatusIcon(list.status)}
              {getStatusText(list.status)}
            </span>
          
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant={
                getPriorityVariant(list.priority) as
                  | "error"
                  | "warning"
                  | "success"
              }
              size="sm"
            >
              {getPriorityText(list.priority)}
            </Badge>
          <Button variant="ghost" size="sm" onClick={() => handleDeleteList(list._id, list.name)}>
            <Trash className="w-4 h-4 text-error-500" />
          </Button>
          </div>
        </div>
        <h3 className="font-bold text-text-primary text-lg leading-tight">{list.name}</h3>
        {list.description && (
          <p className="text-text-muted text-xs line-clamp-2 mb-3">
            {list.description}
          </p>
        )}
      </CardHeader>
      <CardBody padding="md" className="cursor-pointer" >
        <div className="cursor-pointer" onClick={() => handleListClick(list._id)}>
        <div className="space-y-2 mb-3" >
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <User className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">
              {t("lists.createdBy")}: {getCreatedByFullName(list.createdBy)}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <Users className="w-3 h-3 flex-shrink-0" />
            <span>
              {t("lists.members")}: {group?.members?.length}
            </span>
          </div>

          {list.createdAt && (
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <Calendar className="w-3 h-3 flex-shrink-0" />
              <span>
                {new Date(list.createdAt).toLocaleDateString("he-IL")}
              </span>
            </div>
          )}

          {list.tags?.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <Tag className="w-3 h-3 flex-shrink-0" />
              <div className="flex flex-wrap gap-1">
                {list.tags.slice(0, 2).map((tag: string, index: number) => (
                  <span
                    key={index}
                    className="px-1 py-0.5 bg-info-50 border border-border rounded text-xs"
                  >
                    {tag}
                  </span>
                ))}
                {list.tags.length > 2 && (
                  <span className="text-xs">+{list.tags.length - 2}</span>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-text-muted mb-2">
          <span>
            {list.metadata?.itemsCount || 0} {t("lists.items")}
          </span>
          <span>
            {list.metadata?.completedItemsCount || 0} {t("lists.completed")}
          </span>
        </div>

        {list.metadata?.itemsCount > 0 && (
          <div className="w-full bg-info rounded-full h-1.5">
            <div
              className="bg-primary-500 h-1.5 rounded-full transition-all"
              style={{ width: `${completionPercent}%` }}
            />
          </div>
        )}
        </div>
      </CardBody>
    </Card>
  );
}
