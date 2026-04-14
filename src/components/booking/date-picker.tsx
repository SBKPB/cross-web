"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import type { BookableDate } from "@/types/booking";

interface DatePickerProps {
  dates: BookableDate[];
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
  primaryColor?: string;
}

interface DateGroup {
  yearMonth: string;
  label: string;
  dates: BookableDate[];
}

export function DatePicker({
  dates,
  selectedDate,
  onSelectDate,
  primaryColor = "#3b82f6",
}: DatePickerProps) {
  const hasAvailableDates = dates.some((d) => d.isAvailable);

  // 按月份分組
  const dateGroups = useMemo(() => {
    const groups: DateGroup[] = [];
    let currentYearMonth = "";

    for (const dateInfo of dates) {
      const [year, monthStr] = dateInfo.date.split("-");
      const yearMonth = `${year}-${monthStr}`;
      const label = `${year}年${parseInt(monthStr, 10)}月`;

      if (yearMonth !== currentYearMonth) {
        groups.push({ yearMonth, label, dates: [dateInfo] });
        currentYearMonth = yearMonth;
      } else {
        groups[groups.length - 1].dates.push(dateInfo);
      }
    }

    return groups;
  }, [dates]);

  const [currentMonthIndex, setCurrentMonthIndex] = useState(0);

  const currentGroup = dateGroups[currentMonthIndex];
  const hasPrev = currentMonthIndex > 0;
  const hasNext = currentMonthIndex < dateGroups.length - 1;

  return (
    <div className="px-4">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        選擇日期
      </h2>

      {dates.length === 0 || !hasAvailableDates ? (
        <div className="rounded-4xl bg-muted py-10 text-center">
          <p className="text-sm text-muted-foreground">暫無可預約日期</p>
        </div>
      ) : (
        <div className="space-y-4 rounded-4xl bg-card p-4 shadow-sm ring-1 ring-foreground/5">
          {/* 月份切換 */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setCurrentMonthIndex((i) => i - 1)}
              disabled={!hasPrev}
              className={cn(
                "flex size-9 items-center justify-center rounded-full transition-colors",
                hasPrev
                  ? "text-foreground hover:bg-muted"
                  : "cursor-not-allowed text-muted-foreground opacity-30",
              )}
            >
              <ChevronLeft className="size-5" />
            </button>
            <span className="text-base font-semibold text-foreground">
              {currentGroup?.label}
            </span>
            <button
              type="button"
              onClick={() => setCurrentMonthIndex((i) => i + 1)}
              disabled={!hasNext}
              className={cn(
                "flex size-9 items-center justify-center rounded-full transition-colors",
                hasNext
                  ? "text-foreground hover:bg-muted"
                  : "cursor-not-allowed text-muted-foreground opacity-30",
              )}
            >
              <ChevronRight className="size-5" />
            </button>
          </div>

          {/* 日期網格 — 橫向 7 欄，每格顯示 週X / DD */}
          <div className="grid grid-cols-7 gap-1.5">
            {currentGroup?.dates.map((dateInfo) => {
              const isSelected = selectedDate === dateInfo.date;
              const isDisabled = !dateInfo.isAvailable;

              return (
                <button
                  key={dateInfo.date}
                  type="button"
                  onClick={() => !isDisabled && onSelectDate(dateInfo.date)}
                  disabled={isDisabled}
                  className={cn(
                    "flex flex-col items-center rounded-2xl py-2.5 transition-all",
                    isSelected && "text-white shadow-md scale-[1.03]",
                    !isSelected && !isDisabled && "text-foreground hover:bg-muted",
                    isDisabled && "cursor-not-allowed opacity-30",
                  )}
                  style={{
                    backgroundColor: isSelected ? primaryColor : undefined,
                  }}
                >
                  <span className="text-xs font-medium">
                    {dateInfo.isToday ? "今天" : `週${dateInfo.dayOfWeek}`}
                  </span>
                  <span className="mt-0.5 text-lg font-bold">
                    {dateInfo.dayNumber}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
