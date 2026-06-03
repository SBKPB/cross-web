"use client";

import { Clock } from "lucide-react";

import { SectionCard } from "@/components/clinic-detail/section-card";
import { cn } from "@/lib/utils";
import type { BusinessHours } from "@/types/clinic";

interface BusinessHoursSectionProps {
  businessHours: BusinessHours[];
  className?: string;
}

export function BusinessHoursSection({
  businessHours,
  className,
}: BusinessHoursSectionProps) {
  if (businessHours.length === 0) return null;

  const today = new Date().getDay();
  const dayNames = ["週日", "週一", "週二", "週三", "週四", "週五", "週六"];
  const todayName = dayNames[today];

  return (
    <SectionCard icon={Clock} title="營業時間" className={className}>
      <div className="space-y-0.5">
        {businessHours.map((hours) => {
          const isToday = hours.day === todayName;
          return (
            <div
              key={hours.day}
              className={cn(
                "flex items-center justify-between rounded-xl px-3 py-2 transition-colors",
                isToday ? "bg-accent" : "hover:bg-muted",
              )}
            >
              <span
                className={cn(
                  "flex items-center gap-2 text-sm",
                  isToday ? "font-semibold text-accent-foreground" : "text-foreground",
                )}
              >
                {isToday && <span className="size-1.5 rounded-full bg-primary" />}
                {hours.day}
                {isToday && "（今日）"}
              </span>
              <div className="text-right">
                <span
                  className={cn(
                    "text-sm tabular-nums",
                    hours.is_closed
                      ? "text-muted-foreground"
                      : isToday
                        ? "font-semibold text-accent-foreground"
                        : "text-foreground",
                  )}
                >
                  {hours.is_closed ? "休息" : `${hours.open} - ${hours.close}`}
                </span>
                {!hours.is_closed && hours.breaks && hours.breaks.length > 0 && (
                  <div className="text-xs text-muted-foreground">
                    休息 {hours.breaks.map((b) => `${b.start}-${b.end}`).join("、")}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}
