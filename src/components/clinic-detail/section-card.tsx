import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface SectionCardProps {
  icon: LucideIcon;
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

/** 詳細頁共用區段卡片：統一的圓角、陰影、圖示標題節奏 */
export function SectionCard({
  icon: Icon,
  title,
  action,
  children,
  className,
}: SectionCardProps) {
  return (
    <section
      className={cn(
        "rounded-3xl bg-card p-5 shadow-sm ring-1 ring-foreground/5 sm:p-6",
        className,
      )}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2.5 text-base font-semibold text-foreground">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon className="size-[18px]" />
          </span>
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}
