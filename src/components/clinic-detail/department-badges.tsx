"use client";

import { Stethoscope } from "lucide-react";

import { SectionCard } from "@/components/clinic-detail/section-card";
import { Badge } from "@/components/ui/badge";
import { categoryLabel } from "@/lib/api/service-categories";
import { useServiceTaxonomy } from "@/lib/hooks/use-service-taxonomy";
import { DEPARTMENT_COLORS } from "@/lib/constants/clinic-constants";
import { cn } from "@/lib/utils";
import type { FacilityType } from "@/types/clinic";

interface DepartmentBadgesProps {
  departments: string[];
  // 大類；只有「看診」顯示診療科別。醫美/美容/其他的子類別與大類 badge、
  // 服務項目重疊，不另立區塊（單一子類別會顯得多餘）。
  facilityType?: FacilityType;
  className?: string;
}

export function DepartmentBadges({
  departments,
  facilityType,
  className,
}: DepartmentBadgesProps) {
  const tax = useServiceTaxonomy();

  // 只在看診大類顯示「診療科別」；非看診不顯示（undefined 視為看診）
  if (departments.length === 0) return null;
  if (facilityType && facilityType !== "healthcare") return null;

  return (
    <SectionCard icon={Stethoscope} title="診療科別" className={className}>
      <div className="flex flex-wrap gap-2">
        {departments.map((dept) => (
          <Badge
            key={dept}
            className={cn(
              "border-0 px-3 py-1 text-sm",
              // 顏色僅看診 18 科別 code 有定義，其餘 code 用中性底色
              DEPARTMENT_COLORS[dept as keyof typeof DEPARTMENT_COLORS] ??
                "bg-muted text-muted-foreground",
            )}
          >
            {categoryLabel(tax, dept)}
          </Badge>
        ))}
      </div>
    </SectionCard>
  );
}
