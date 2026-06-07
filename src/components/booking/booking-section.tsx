import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface BookingSectionProps {
  /** 區段序號（如 1、2、3），顯示在標題前的圓形徽章 */
  index?: number;
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  /** 主色（用於序號徽章），對齊院所詳情頁設計語言 */
  primaryColor?: string;
}

/**
 * 預約流程共用區段卡片：圓角 / 柔色 ring / 序號徽章標題，
 * 與院所詳情頁 SectionCard 一致的視覺節奏。
 */
export function BookingSection({
  index,
  title,
  description,
  action,
  children,
  className,
  primaryColor,
}: BookingSectionProps) {
  return (
    <section
      className={cn(
        "rounded-3xl bg-card p-5 shadow-sm ring-1 ring-foreground/5 sm:p-6",
        className,
      )}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          {index !== undefined && (
            <span
              className="flex size-7 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white shadow-sm"
              style={{ backgroundColor: primaryColor }}
            >
              {index}
            </span>
          )}
          <div>
            <h2 className="text-base font-semibold leading-tight text-foreground">
              {title}
            </h2>
            {description && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                {description}
              </p>
            )}
          </div>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
