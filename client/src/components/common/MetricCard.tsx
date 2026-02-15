import React from "react";

export function MetricCard({
    icon,
    value,
    label,
    bgColor,
  }: {
    icon: React.ReactNode;
    value: number;
    label: string;
    bgColor: string;
  }) {
    return (
    <div
      className={`flex items-center gap-3 p-4 rounded-xl ${bgColor} group transition-all duration-300 hover:shadow-md cursor-pointer`}
    >
      <div className="p-2 rounded-full bg-card shadow-sm flex-shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-text-primary">{value}</p>
        <p className="text-sm text-text-secondary">{label}</p>
      </div>
    </div>
  );
}
