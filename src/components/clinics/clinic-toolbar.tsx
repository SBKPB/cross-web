"use client";

import { Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DEPARTMENT_OPTIONS,
  HOSPITAL_LEVEL_OPTIONS,
} from "@/lib/constants/clinic-constants";
import { cn } from "@/lib/utils";
import type { ClinicFilters } from "@/types/clinic";

interface ClinicToolbarProps {
  filters: ClinicFilters;
  onFiltersChange: (filters: ClinicFilters) => void;
  className?: string;
}

export function ClinicToolbar({
  filters,
  onFiltersChange,
  className,
}: ClinicToolbarProps) {
  const hasActiveFilters =
    filters.search ||
    filters.hospitalLevel !== "all" ||
    filters.department !== "all";

  const handleClearFilters = () => {
    onFiltersChange({
      search: "",
      hospitalLevel: "all",
      department: "all",
    });
  };

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row gap-3",
        "p-4 rounded-xl",
        "bg-white border border-n-border",
        "shadow-sm",
        className
      )}
    >
      {/* 搜尋框 */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-n-muted" />
        <Input
          type="text"
          placeholder="搜尋院所名稱..."
          value={filters.search}
          onChange={(e) =>
            onFiltersChange({ ...filters, search: e.target.value })
          }
          className={cn(
            "pl-10 pr-4",
            "bg-white text-n-body placeholder:text-n-muted",
            "border-n-border",
            "focus:border-n-border-focus focus:ring-n-brand/10"
          )}
        />
      </div>

      {/* 篩選器 */}
      <div className="flex gap-2">
        <Select
          value={filters.hospitalLevel}
          onValueChange={(value) =>
            onFiltersChange({
              ...filters,
              hospitalLevel: value as ClinicFilters["hospitalLevel"],
            })
          }
        >
          <SelectTrigger
            className={cn("w-[140px]", "bg-white text-n-body", "border-n-border")}
          >
            <SelectValue placeholder="醫療分級" />
          </SelectTrigger>
          <SelectContent className="bg-white border-n-border text-n-body">
            {HOSPITAL_LEVEL_OPTIONS.map((option) => (
              <SelectItem
                key={option.value}
                value={option.value}
                className="focus:bg-n-brand-soft focus:text-n-brand"
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.department}
          onValueChange={(value) =>
            onFiltersChange({
              ...filters,
              department: value as ClinicFilters["department"],
            })
          }
        >
          <SelectTrigger
            className={cn("w-[140px]", "bg-white text-n-body", "border-n-border")}
          >
            <SelectValue placeholder="科別" />
          </SelectTrigger>
          <SelectContent className="bg-white border-n-border text-n-body">
            {DEPARTMENT_OPTIONS.map((option) => (
              <SelectItem
                key={option.value}
                value={option.value}
                className="focus:bg-n-brand-soft focus:text-n-brand"
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClearFilters}
            className="shrink-0 text-n-muted hover:text-n-brand hover:bg-n-brand-soft"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">清除篩選</span>
          </Button>
        )}
      </div>
    </div>
  );
}
