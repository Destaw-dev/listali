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
            className="text-neutral-300"
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
            className="text-accent-500 transition-all duration-700"
          />
        </svg>
  
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold text-neutral-700">{progress}%</span>
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
      accent: "text-success-600 bg-success-50",
    },
    {
      id: "remaining",
      label: t("stats.remaining"),
      value: remainingItems,
      icon: ShoppingBag,
      accent: "text-primary-600 bg-primary-50",
    },
    {
      id: "active",
      label: t("stats.activeShoppers"),
      value: activeShoppers,
      icon: Users,
      accent: "text-secondary-600 bg-secondary-50",
    },
    {
      id: "progress",
      label: t("stats.progress"),
      value: <ProgressRing progress={progress} />,
      icon: Clock,
      accent: "text-secondary-600 bg-secondary-50",
    }
  ] as const;
  

  return (
    <section className="grid grid-cols-2 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map(({ id, label, value, icon: Icon, accent }) => (
        <article
          key={id}
          className="flex flex-col justify-between rounded-2xl bg-card p-4 shadow-lg backdrop-blur-sm transition hover:-translate-y-0.5 hover:shadow-xl"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-text-muted">{label}</span>
            <span
              className={`flex h-9 w-9 items-center justify-center rounded-2xl ${accent}`}
            >
              <Icon className="h-4 w-4" />
            </span>
          </div>
          <div className="text-2xl font-semibold text-text-primary">
            {value}
          </div>
        </article>
      ))}
    </section>
  );
}
