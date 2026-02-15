"use client";

import { useTranslations } from "next-intl";
import {
  CheckCircle,
  Clock,
  ShoppingBag,
  Users,
} from "lucide-react";

interface ShoppingListStatsProps {
  totalItems: number;
  purchasedItems: number;
  activeShoppers: number;
}

export function ShoppingListStats({
  totalItems,
  purchasedItems,
  activeShoppers,
}: ShoppingListStatsProps) {
  const t = useTranslations("ShoppingListPage");
  const remainingItems = Math.max(totalItems - purchasedItems, 0);
  const progress =
    totalItems > 0 ? Math.round((purchasedItems / totalItems) * 100) : 0;



  const ProgressRing: React.FC<{ progress: number }> = ({ progress }) => {
    const radius = 30;
    const stroke = 8;
    const normalizedRadius = radius - stroke / 2;
    const circumference = 2 * Math.PI * normalizedRadius;
  
    const offset = circumference - (progress / 100) * circumference;
  
    return (
      <div className="relative h-14 w-14">
        <svg height={radius * 2} width={radius * 2} className="rotate-90">
          
          <circle
            stroke="currentColor"
            fill="transparent"
            strokeWidth={stroke}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            strokeDasharray="4 4"   
            className="text-border"
          />
  
          <circle
            stroke="currentColor"
            fill="transparent"
            strokeWidth={stroke}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="text-accent transition-all duration-700"
          />
        </svg>
  
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold text-text-primary">{progress}%</span>
        </div>
      </div>
    );
  };

  const cards = [
    {
      id: "purchased",
      label: t("stats.purchased"),
      value: purchasedItems,
      icon: CheckCircle,
      accent: "text-success bg-[var(--color-status-success-soft)]",
    },
    {
      id: "remaining",
      label: t("stats.remaining"),
      value: remainingItems,
      icon: ShoppingBag,
      accent: "text-[var(--color-icon-primary-fg)] bg-[var(--color-icon-primary-bg)]",
    },
    {
      id: "active",
      label: t("stats.activeShoppers"),
      value: activeShoppers,
      icon: Users,
      accent: "text-[var(--color-icon-secondary-fg)] bg-[var(--color-icon-secondary-bg)]",
    },
    {
      id: "progress",
      label: t("stats.progress"),
      value: <ProgressRing progress={progress} />,
      icon: Clock,
      accent: "text-[var(--color-icon-info-fg)] bg-[var(--color-icon-info-bg)]",
    }
  ] as const;
  

  return (
    <section className="grid grid-cols-2 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map(({ id, label, value, icon: Icon, accent }) => (
        <article
          key={id}
          className="group flex flex-col justify-between rounded-2xl bg-card p-5 shadow-lg backdrop-blur-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-xl border border-border/30 hover:border-border/60"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-text-muted">{label}</span>
            <span
              className={`flex h-10 w-10 items-center justify-center rounded-xl ${accent} transition-transform duration-200 group-hover:scale-110 shadow-sm`}
            >
              <Icon className="h-5 w-5" />
            </span>
          </div>
          <div className="text-3xl font-bold text-text-primary">
            {value}
          </div>
        </article>
      ))}
    </section>
  );
}
