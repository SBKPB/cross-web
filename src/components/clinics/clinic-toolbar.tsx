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
  CITY_OPTIONS,
  DEPARTMENT_OPTIONS,
  FACILITY_TYPE_OPTIONS,
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
    filters.department !== "all" ||
    filters.city !== "all" ||
    filters.facilityType !== "all";

  const handleClearFilters = () => {
    onFiltersChange({
      search: "",
      hospitalLevel: "all",
      department: "all",
      city: "all",
      facilityType: "all",
    });
  };

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row gap-3",
        "p-4 rounded-xl",
        "bg-white border border-border",
        "shadow-sm",
        className
      )}
    >
      {/* 搜尋框 */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="搜尋院所名稱..."
          value={filters.search}
          onChange={(e) =>
            onFiltersChange({ ...filters, search: e.target.value })
          }
          className={cn(
            "pl-10 pr-4",
            "bg-white text-foreground placeholder:text-muted-foreground",
            "border-border",
            "focus:border-primary/40 focus:ring-primary/10"
          )}
        />
      </div>

      {/* 篩選器 */}
      <div className="flex flex-wrap gap-2">
        <Select
          value={filters.facilityType}
          onValueChange={(value) =>
            onFiltersChange({
              ...filters,
              facilityType: value as ClinicFilters["facilityType"],
            })
          }
        >
          <SelectTrigger
            className={cn("w-[140px]", "bg-white text-foreground", "border-border")}
          >
            <SelectValue placeholder="服務類型" />
          </SelectTrigger>
          <SelectContent className="bg-white border-border text-foreground">
            {FACILITY_TYPE_OPTIONS.map((option) => (
              <SelectItem
                key={option.value}
                value={option.value}
                className="focus:bg-accent focus:text-primary"
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.city}
          onValueChange={(value) =>
            onFiltersChange({ ...filters, city: value })
          }
        >
          <SelectTrigger
            className={cn("w-[140px]", "bg-white text-foreground", "border-border")}
          >
            <SelectValue placeholder="縣市" />
          </SelectTrigger>
          <SelectContent className="bg-white border-border text-foreground max-h-[320px]">
            {CITY_OPTIONS.map((option) => (
              <SelectItem
                key={option.value}
                value={option.value}
                className="focus:bg-accent focus:text-primary"
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

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
            className={cn("w-[140px]", "bg-white text-foreground", "border-border")}
          >
            <SelectValue placeholder="醫療分級" />
          </SelectTrigger>
          <SelectContent className="bg-white border-border text-foreground">
            {HOSPITAL_LEVEL_OPTIONS.map((option) => (
              <SelectItem
                key={option.value}
                value={option.value}
                className="focus:bg-accent focus:text-primary"
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
            className={cn("w-[140px]", "bg-white text-foreground", "border-border")}
          >
            <SelectValue placeholder="科別" />
          </SelectTrigger>
          <SelectContent className="bg-white border-border text-foreground">
            {DEPARTMENT_OPTIONS.map((option) => (
              <SelectItem
                key={option.value}
                value={option.value}
                className="focus:bg-accent focus:text-primary"
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
            className="shrink-0 text-muted-foreground hover:text-primary hover:bg-accent"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">清除篩選</span>
          </Button>
        )}
      </div>
    </div>
  );
}
