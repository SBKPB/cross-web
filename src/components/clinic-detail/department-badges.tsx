"use client";

import { Stethoscope } from "lucide-react";

import { SectionCard } from "@/components/clinic-detail/section-card";
import { Badge } from "@/components/ui/badge";
import { categoryLabel, facilityTypeLabel } from "@/lib/api/service-categories";
import { useServiceTaxonomy } from "@/lib/hooks/use-service-taxonomy";
import { DEPARTMENT_COLORS } from "@/lib/constants/clinic-constants";
import { cn } from "@/lib/utils";
import type { FacilityType } from "@/types/clinic";

interface DepartmentBadgesProps {
  departments: string[];
  // 大類；用來決定標題（看診→「醫療科別」，醫美/美容/其他→「服務項目」），預設看診
  facilityType?: FacilityType;
  className?: string;
}

export function DepartmentBadges({
  departments,
  facilityType,
  className,
}: DepartmentBadgesProps) {
  const tax = useServiceTaxonomy();

  if (departments.length === 0) return null;

  // 標題依大類取 taxonomy label（看診/醫美/美容/其他），無 facility_type 時泛化為「服務項目」
  const title = facilityType
    ? `${facilityTypeLabel(tax, facilityType)}服務項目`
    : "服務項目";

  return (
    <SectionCard icon={Stethoscope} title={title} className={className}>
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
