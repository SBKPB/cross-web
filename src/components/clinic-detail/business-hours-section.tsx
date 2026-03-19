"use client";

import { Clock } from "lucide-react";
import type { BusinessHours } from "@/types/clinic";
import { cn } from "@/lib/utils";

interface BusinessHoursSectionProps {
  businessHours: BusinessHours[];
  className?: string;
}

export function BusinessHoursSection({
  businessHours,
  className,
}: BusinessHoursSectionProps) {
  if (businessHours.length === 0) return null;

  // 取得今天是星期幾
  const today = new Date().getDay();
  const dayNames = ["週日", "週一", "週二", "週三", "週四", "週五", "週六"];
  const todayName = dayNames[today];

  return (
    <div className={cn("px-4 sm:px-6", className)}>
      <div className="rounded-2xl border border-n-border bg-n-card p-4 sm:p-5">
        <div className="mb-3 flex items-center gap-2">
          <Clock className="size-4 text-n-brand" />
          <h2 className="text-sm font-semibold text-n-heading">營業時間</h2>
        </div>

        {/* Compact grid layout */}
        <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
          {businessHours.map((hours) => {
            const isToday = hours.day === todayName;
            return (
              <div
                key={hours.day}
                className={cn(
                  "flex items-center justify-between rounded-lg px-3 py-2 transition-colors",
                  isToday
                    ? "bg-n-brand-soft/60"
                    : "hover:bg-n-section"
                )}
              >
                <div className="flex items-center gap-2">
                  {isToday && (
                    <span className="size-1.5 rounded-full bg-n-brand" />
                  )}
                  <span
                    className={cn(
                      "text-sm",
                      isToday
                        ? "font-semibold text-n-brand"
                        : "text-n-body"
                    )}
                  >
                    {hours.day}
                    {isToday && " (今日)"}
                  </span>
                </div>
                <span
                  className={cn(
                    "text-sm tabular-nums",
                    hours.is_closed
                      ? "text-n-muted"
                      : isToday
                        ? "font-semibold text-n-brand"
                        : "text-n-body"
                  )}
                >
                  {hours.is_closed ? "休息" : `${hours.open} - ${hours.close}`}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
