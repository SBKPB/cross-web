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
  yearMonth: string; // "2026-02"
  label: string; // "2026年2月"
  dates: BookableDate[];
}

export function DatePicker({
  dates,
  selectedDate,
  onSelectDate,
  primaryColor = "#3b82f6",
}: DatePickerProps) {
  // 檢查是否有可預約的日期
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

  // 當前顯示的月份索引
  const [currentMonthIndex, setCurrentMonthIndex] = useState(0);

  const currentGroup = dateGroups[currentMonthIndex];
  const hasPrev = currentMonthIndex > 0;
  const hasNext = currentMonthIndex < dateGroups.length - 1;

  return (
    <div className="px-4">
      <h2 className="mb-3 text-sm font-medium text-slate-500">選擇日期</h2>

      {dates.length === 0 || !hasAvailableDates ? (
        <div className="rounded-xl bg-slate-100 py-8 text-center">
          <p className="text-sm text-slate-500">暫無可預約日期</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* 月份切換 */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setCurrentMonthIndex((i) => i - 1)}
              disabled={!hasPrev}
              className={cn(
                "flex size-8 items-center justify-center rounded-full transition-colors",
                hasPrev ? "hover:bg-slate-100" : "opacity-30"
              )}
            >
              <ChevronLeft className="size-5" />
            </button>
            <span className="text-base font-semibold">{currentGroup?.label}</span>
            <button
              type="button"
              onClick={() => setCurrentMonthIndex((i) => i + 1)}
              disabled={!hasNext}
              className={cn(
                "flex size-8 items-center justify-center rounded-full transition-colors",
                hasNext ? "hover:bg-slate-100" : "opacity-30"
              )}
            >
              <ChevronRight className="size-5" />
            </button>
          </div>

          {/* 日期網格 */}
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
                    "flex flex-col items-center rounded-xl py-2 transition-all",
                    isSelected && "text-white shadow-md",
                    !isSelected && !isDisabled && "bg-white hover:bg-slate-50",
                    isDisabled && "cursor-not-allowed opacity-40"
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
