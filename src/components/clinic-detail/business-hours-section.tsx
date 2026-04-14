"use client";

import { Clock } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
    <div className={cn("px-4 sm:px-6", className)}>
      <Card size="sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Clock className="size-4 text-primary" />
            營業時間
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
            {businessHours.map((hours) => {
              const isToday = hours.day === todayName;
              return (
                <div
                  key={hours.day}
                  className={cn(
                    "flex items-center justify-between rounded-2xl px-3 py-2 transition-colors",
                    isToday ? "bg-accent" : "hover:bg-muted",
                  )}
                >
                  <div className="flex items-center gap-2">
                    {isToday && (
                      <span className="size-1.5 rounded-full bg-primary" />
                    )}
                    <span
                      className={cn(
                        "text-sm",
                        isToday ? "font-semibold text-accent-foreground" : "text-foreground",
                      )}
                    >
                      {hours.day}
                      {isToday && " (今日)"}
                    </span>
                  </div>
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
        </CardContent>
      </Card>
    </div>
  );
}
