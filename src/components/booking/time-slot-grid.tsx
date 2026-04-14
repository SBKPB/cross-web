"use client";

import { useMemo } from "react";

import { TIME_PERIODS } from "@/lib/constants/booking-constants";
import { cn } from "@/lib/utils";
import type { TimeOfDay, TimeSlot } from "@/types/booking";

interface TimeSlotGridProps {
  slots: TimeSlot[];
  selectedSlot: TimeSlot | null;
  onSelectSlot: (slot: TimeSlot) => void;
  primaryColor?: string;
}

export function TimeSlotGrid({
  slots,
  selectedSlot,
  onSelectSlot,
  primaryColor = "#3b82f6",
}: TimeSlotGridProps) {
  const groupedSlots = useMemo(() => {
    const groups: Record<TimeOfDay, TimeSlot[]> = {
      morning: [],
      afternoon: [],
      evening: [],
    };
    for (const slot of slots) groups[slot.period].push(slot);
    return groups;
  }, [slots]);

  const periods: TimeOfDay[] = ["morning", "afternoon", "evening"];

  return (
    <div className="space-y-5 px-4">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        選擇時間
      </h2>

      <div className="space-y-5 rounded-4xl bg-card p-4 shadow-sm ring-1 ring-foreground/5">
        {periods.map((period) => {
          const periodSlots = groupedSlots[period];
          const availableSlots = periodSlots.filter((s) => s.isAvailable);

          if (periodSlots.length === 0) return null;

          return (
            <div key={period}>
              <h3 className="mb-2.5 flex items-center gap-2 text-sm font-semibold text-foreground">
                {TIME_PERIODS[period].label}
                <span className="text-xs font-normal text-muted-foreground">
                  · {availableSlots.length} 個可預約
                </span>
              </h3>

              <div className="grid grid-cols-4 gap-2">
                {periodSlots.map((slot) => {
                  const isSelected = selectedSlot?.id === slot.id;
                  const isDisabled = !slot.isAvailable;

                  return (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => !isDisabled && onSelectSlot(slot)}
                      disabled={isDisabled}
                      className={cn(
                        "rounded-full py-2.5 text-sm font-medium transition-all",
                        isSelected && "text-white shadow-md scale-[1.03]",
                        !isSelected && !isDisabled && "bg-muted/60 text-foreground hover:bg-muted",
                        isDisabled && "cursor-not-allowed bg-muted/30 text-muted-foreground/50 line-through",
                      )}
                      style={{
                        backgroundColor: isSelected ? primaryColor : undefined,
                      }}
                    >
                      {slot.time}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
