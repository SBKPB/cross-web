"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import type { TimeSlot, TimeOfDay } from "@/types/booking";
import { TIME_PERIODS } from "@/lib/constants/booking-constants";

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
  // 依時段分組
  const groupedSlots = useMemo(() => {
    const groups: Record<TimeOfDay, TimeSlot[]> = {
      morning: [],
      afternoon: [],
      evening: [],
    };

    for (const slot of slots) {
      groups[slot.period].push(slot);
    }

    return groups;
  }, [slots]);

  const periods: TimeOfDay[] = ["morning", "afternoon", "evening"];

  return (
    <div className="space-y-4 px-4">
      <h2 className="text-sm font-medium text-slate-500">選擇時間</h2>

      {periods.map((period) => {
        const periodSlots = groupedSlots[period];
        const availableSlots = periodSlots.filter((s) => s.isAvailable);

        if (periodSlots.length === 0) return null;

        return (
          <div key={period}>
            <h3 className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
              {TIME_PERIODS[period].label}
              <span className="text-xs font-normal text-slate-400">
                ({availableSlots.length} 個可預約)
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
                      "rounded-lg py-2.5 text-sm font-medium transition-all",
                      isSelected && "text-white shadow-md",
                      !isSelected && !isDisabled && "bg-white hover:bg-slate-50 text-slate-700",
                      isDisabled && "cursor-not-allowed bg-slate-100 text-slate-300 line-through"
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
  );
}
