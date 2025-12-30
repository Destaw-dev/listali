import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Dropdown, DropdownOption } from "@/components/common";
import { Button } from "@/components/common/Button";
import { Badge } from "@/components/common/Badge";
import { Filter, X } from "lucide-react";


interface FilterDropdownMenuProps {
    t: ReturnType<typeof useTranslations>;
    statusFilter: string;
    priorityFilter: string;
    setStatusFilter: (filter: string) => void;
    setPriorityFilter: (filter: string) => void;
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    activeFiltersCount: number;
}

export function FilterDropdownMenu({
    t,
    statusFilter,
    priorityFilter,
    setStatusFilter,
    setPriorityFilter,
    isOpen,
    setIsOpen,
    activeFiltersCount,
}: FilterDropdownMenuProps) {
  
  const [tempStatusFilter, setTempStatusFilter] = useState<string>(statusFilter);
  const [tempPriorityFilter, setTempPriorityFilter] = useState<string>(priorityFilter);

  useEffect(() => {
    if (isOpen) {
      setTempStatusFilter(statusFilter);
      setTempPriorityFilter(priorityFilter);
    }
  }, [isOpen, statusFilter, priorityFilter]);

  const advancedFilterOptions: DropdownOption[] = [
    { label: t("lists.filters.status"), value: "_header-status", disabled: true },
    { label: t("lists.filters.allStatuses"), value: "status-all" },
    { label: t("lists.status.active"), value: "status-active" },
    { label: t("lists.status.completed"), value: "status-completed" },
    { label: t("lists.status.archived"), value: "status-archived" },
    { divider: true, label: "", value: "_divider-status" },
    { label: t("lists.filters.priority"), value: "_header-priority", disabled: true },
    { label: t("lists.filters.allPriorities"), value: "priority-all" },
    { label: t("lists.high"), value: "priority-high" },
    { label: t("lists.medium"), value: "priority-medium" },
    { label: t("lists.low"), value: "priority-low" },
  ];

  const optionsWithSelection = advancedFilterOptions.map(option => {
    let isSelected = false;
    const optionValue = String(option.value);
    if (optionValue.startsWith("status-")) {
      isSelected = optionValue.replace("status-", "") === tempStatusFilter;
    } else if (optionValue.startsWith("priority-")) {
      isSelected = optionValue.replace("priority-", "") === tempPriorityFilter;
    }
    return { ...option, isSelected };
  });

  const handleFilterSelection = (value: string | number) => {
    const stringValue = String(value);
    if (stringValue.startsWith("status-")) {
      setTempStatusFilter(stringValue.replace("status-", ""));
    } else if (stringValue.startsWith("priority-")) {
      setTempPriorityFilter(stringValue.replace("priority-", ""));
    }
  };

  const handleApply = () => {
    setStatusFilter(tempStatusFilter);
    setPriorityFilter(tempPriorityFilter);
    setIsOpen(false);
  };

  return (
    <Dropdown
      options={optionsWithSelection}
      value={t("lists.filterAdvanced")}
      placeholder={t("lists.filterAdvanced")}
      onSelect={handleFilterSelection}
      closeOnSelect={false}
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      trigger={
        <Button
          variant={activeFiltersCount > 0 ? "primary" : "outline"}
          size="md"
          icon={<Filter className="w-4 h-4" />}
        >
          {t("lists.filterAdvanced")}
          {activeFiltersCount > 0 && (
            <Badge
              variant='warning'
              size="sm"
              className="absolute -top-1 -start-1 min-w-[20px] h-5 flex items-center justify-center px-1"
            >
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      }
      footer={
        <Button
          variant="primary"
          size="sm"
          fullWidth
          onClick={handleApply}
        >
          {t("lists.filters.apply")}
        </Button>
      }
      menuClassName="min-w-[200px]"
      optionClassName="text-sm"
    />
  );
}

interface ActiveFilterBadgesProps {
    t: ReturnType<typeof useTranslations>;
    statusFilter: string;
    priorityFilter: string;
    setStatusFilter: (filter: string) => void;
    setPriorityFilter: (filter: string) => void;
    handleClearAll: () => void;
}

export function ActiveFilterBadges({
    t,
    statusFilter,
    priorityFilter,
    setStatusFilter,
    setPriorityFilter,
    handleClearAll,
}: ActiveFilterBadgesProps) {

    const filterOptions: { [key: string]: string } = {
        "status-active": t("lists.status.active"),
        "status-completed": t("lists.status.completed"),
        "status-archived": t("lists.status.archived"),
        "priority-high": t("lists.high"),
        "priority-medium": t("lists.medium"),
        "priority-low": t("lists.low"),
    };
    
    const getFilterLabel = (type: 'status' | 'priority', value: string) => {
        return filterOptions[`${type}-${value}`] || '';
    }

    return (
        <div className="flex items-center gap-2 flex-wrap">
            {statusFilter !== "all" && (
            <Badge
                variant="primary"
                size="md"
                className="flex items-center gap-2 px-3 py-1"
                onClick={() => setStatusFilter("all")}
                aria-label={t("lists.removeStatus")}
            >
                <span>{getFilterLabel('status', statusFilter)}</span>
                <X className="w-3 h-3" />
            </Badge>
            )}
            {priorityFilter !== "all" && (
            <Badge
                variant="secondary"
                size="md"
                className="flex items-center gap-2 px-3 py-1"
                onClick={() => setPriorityFilter("all")}
                aria-label={t("lists.removePriority")}
            >
                <span>{getFilterLabel('priority', priorityFilter)}</span>
                <X className="w-3 h-3" />
            </Badge>
            )}
            {(statusFilter !== "all" || priorityFilter !== "all") && (
                <Button
                    variant='ghost'
                    size="sm"
                    onClick={handleClearAll}
                    icon={<X className="w-3 h-3" />}
                >
                    {t("lists.clearAll")}
                </Button>
            )}
        </div>
    );
}