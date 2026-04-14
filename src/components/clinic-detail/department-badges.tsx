"use client";

import { Stethoscope } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
    <div className={cn("px-4 sm:px-6", className)}>
      <Card size="sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Stethoscope className="size-4 text-primary" />
            醫療科別
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {departments.map((dept) => (
              <Badge
                key={dept}
                className={cn(
                  "border-0 px-3 py-1",
                  DEPARTMENT_COLORS[dept as keyof typeof DEPARTMENT_COLORS] ??
                    "bg-muted text-muted-foreground",
                )}
              >
                {getDeptLabel(dept)}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
