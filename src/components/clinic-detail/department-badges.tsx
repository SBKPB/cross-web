"use client";

import { Badge } from "@/components/ui/badge";
import {
  MEDICAL_DEPARTMENTS,
  DEPARTMENT_COLORS,
  API_MEDICAL_DEPARTMENTS,
} from "@/lib/constants/clinic-constants";
import { cn } from "@/lib/utils";
import { Stethoscope } from "lucide-react";

interface DepartmentBadgesProps {
  departments: string[];
  className?: string;
}

export function DepartmentBadges({ departments, className }: DepartmentBadgesProps) {
  if (departments.length === 0) return null;

  // 取得科別顯示名稱（同時支援前端 MedicalDepartment 與後端 ApiMedicalDepartment）
  const getDeptLabel = (dept: string): string => {
    return (
      MEDICAL_DEPARTMENTS[dept as keyof typeof MEDICAL_DEPARTMENTS] ??
      API_MEDICAL_DEPARTMENTS[dept as keyof typeof API_MEDICAL_DEPARTMENTS] ??
      dept
    );
  };

  return (
    <div className={cn("px-4 sm:px-6", className)}>
      <div className="rounded-2xl border border-n-border bg-n-card p-4 sm:p-5">
        <div className="mb-3 flex items-center gap-2">
          <Stethoscope className="size-4 text-n-brand" />
          <h2 className="text-sm font-semibold text-n-heading">醫療科別</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {departments.map((dept) => (
            <Badge
              key={dept}
              variant="secondary"
              className={cn(
                "rounded-full border-none px-3 py-1",
                DEPARTMENT_COLORS[dept as keyof typeof DEPARTMENT_COLORS] ??
                  "bg-n-section text-n-body"
              )}
            >
              {getDeptLabel(dept)}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}
