"use client";

import { Stethoscope } from "lucide-react";

import { SectionCard } from "@/components/clinic-detail/section-card";
import { Badge } from "@/components/ui/badge";
import {
  API_MEDICAL_DEPARTMENTS,
  DEPARTMENT_COLORS,
  MEDICAL_DEPARTMENTS,
} from "@/lib/constants/clinic-constants";
import { cn } from "@/lib/utils";

interface DepartmentBadgesProps {
  departments: string[];
  className?: string;
}

export function DepartmentBadges({ departments, className }: DepartmentBadgesProps) {
  if (departments.length === 0) return null;

  const getDeptLabel = (dept: string): string =>
    MEDICAL_DEPARTMENTS[dept as keyof typeof MEDICAL_DEPARTMENTS] ??
    API_MEDICAL_DEPARTMENTS[dept as keyof typeof API_MEDICAL_DEPARTMENTS] ??
    dept;

  return (
    <SectionCard icon={Stethoscope} title="醫療科別" className={className}>
      <div className="flex flex-wrap gap-2">
        {departments.map((dept) => (
          <Badge
            key={dept}
            className={cn(
              "border-0 px-3 py-1 text-sm",
              DEPARTMENT_COLORS[dept as keyof typeof DEPARTMENT_COLORS] ??
                "bg-muted text-muted-foreground",
            )}
          >
            {getDeptLabel(dept)}
          </Badge>
        ))}
      </div>
    </SectionCard>
  );
}
