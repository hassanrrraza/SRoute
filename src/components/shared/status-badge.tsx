"use client";

import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  colorMap: Record<string, string>;
}

export function StatusBadge({ status, colorMap }: StatusBadgeProps) {
  const colorClass = colorMap[status] || "bg-slate-100 text-slate-700";

  return (
    <span
      className={cn(
        "px-2.5 py-1 rounded-full text-xs font-medium",
        colorClass
      )}
    >
      {status}
    </span>
  );
}
