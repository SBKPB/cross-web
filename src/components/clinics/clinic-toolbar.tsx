"use client";

import {
  LayoutGrid,
  Search,
  Sparkles,
  Stethoscope,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";

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
  HOSPITAL_LEVEL_OPTIONS,
  HOSPITAL_LEVELS,
  MEDICAL_DEPARTMENTS,
} from "@/lib/constants/clinic-constants";
import { cn } from "@/lib/utils";
import type { ClinicFilters, MedicalDepartment } from "@/types/clinic";

interface ClinicToolbarProps {
  filters: ClinicFilters;
  onFiltersChange: (filters: ClinicFilters) => void;
  className?: string;
}

// 服務類型分段控制（民眾端三分流，與首頁 Hero tabs 視覺一致）
const FACILITY_TABS: {
  value: ClinicFilters["facilityType"];
  label: string;
  icon: LucideIcon;
}[] = [
  { value: "all", label: "全部", icon: LayoutGrid },
  { value: "healthcare", label: "健保", icon: Stethoscope },
  { value: "self_pay", label: "自費", icon: Wallet },
  { value: "aesthetic", label: "美容", icon: Sparkles },
];

// select trigger 共用樣式：面板內 inset 風格（淺灰底、無外框陰影），hover 微亮
const TRIGGER_CLASS = cn(
  "!h-11 min-w-[128px] flex-1 rounded-xl border-transparent bg-secondary/70 px-4 text-sm",
  "transition-colors hover:bg-secondary sm:flex-none",
  "data-[placeholder]:text-muted-foreground",
);

const CONTENT_CLASS = "bg-white border-border text-foreground";
const ITEM_CLASS = "focus:bg-accent focus:text-primary";

export function ClinicToolbar({
  filters,
  onFiltersChange,
  className,
}: ClinicToolbarProps) {
  // 健保看診才有「醫療分級 / 科別」概念；美容、自費不分
  const showHealthcareFilters =
    filters.facilityType === "all" || filters.facilityType === "healthcare";

  const handleClearFilters = () => {
    onFiltersChange({
      search: "",
      hospitalLevel: "all",
      department: "all",
      city: "all",
      facilityType: "all",
    });
  };

  const handleFacilityType = (value: ClinicFilters["facilityType"]) => {
    const isHealthcareScope = value === "all" || value === "healthcare";
    onFiltersChange({
      ...filters,
      facilityType: value,
      hospitalLevel: isHealthcareScope ? filters.hospitalLevel : "all",
      department: isHealthcareScope ? filters.department : "all",
    });
  };

  // 已套用的篩選（服務類型已用分段控制呈現，故不重複列入 chips）
  const activeChips: { key: string; label: string; onRemove: () => void }[] = [];
  if (filters.search) {
    activeChips.push({
      key: "search",
      label: `「${filters.search}」`,
      onRemove: () => onFiltersChange({ ...filters, search: "" }),
    });
  }
  if (filters.city !== "all") {
    activeChips.push({
      key: "city",
      label: filters.city,
      onRemove: () => onFiltersChange({ ...filters, city: "all" }),
    });
  }
  if (showHealthcareFilters && filters.hospitalLevel !== "all") {
    activeChips.push({
      key: "level",
      label: HOSPITAL_LEVELS[filters.hospitalLevel],
      onRemove: () => onFiltersChange({ ...filters, hospitalLevel: "all" }),
    });
  }
  if (showHealthcareFilters && filters.department !== "all") {
    activeChips.push({
      key: "dept",
      label:
        MEDICAL_DEPARTMENTS[filters.department as MedicalDepartment] ??
        filters.department,
      onRemove: () => onFiltersChange({ ...filters, department: "all" }),
    });
  }

  return (
    <div
      className={cn(
        "space-y-3 rounded-3xl bg-white p-3 ring-1 ring-border/60 shadow-sm sm:p-4",
        className,
      )}
    >
      {/* 服務類型分段控制 */}
      <div
        role="tablist"
        aria-label="服務類型"
        className="inline-flex items-center gap-1 rounded-full bg-secondary p-1"
      >
        {FACILITY_TABS.map((tab) => {
          const active = filters.facilityType === tab.value;
          const Icon = tab.icon;
          return (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => handleFacilityType(tab.value)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-all",
                active
                  ? "bg-white text-primary shadow-sm ring-1 ring-border/60"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="size-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 搜尋框 + 篩選器 */}
      <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="搜尋店家名稱或地址…"
            value={filters.search}
            onChange={(e) =>
              onFiltersChange({ ...filters, search: e.target.value })
            }
            className={cn(
              "h-11 rounded-xl border-transparent bg-secondary/70 pl-11 pr-4 text-base shadow-none",
              "transition-colors hover:bg-secondary focus-visible:bg-white",
            )}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Select
            value={filters.city}
            onValueChange={(value) =>
              onFiltersChange({ ...filters, city: value })
            }
          >
            <SelectTrigger className={TRIGGER_CLASS} aria-label="縣市">
              <SelectValue placeholder="縣市" />
            </SelectTrigger>
            <SelectContent className={cn(CONTENT_CLASS, "max-h-[320px]")}>
              {CITY_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value} className={ITEM_CLASS}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {showHealthcareFilters && (
            <>
              <Select
                value={filters.hospitalLevel}
                onValueChange={(value) =>
                  onFiltersChange({
                    ...filters,
                    hospitalLevel: value as ClinicFilters["hospitalLevel"],
                  })
                }
              >
                <SelectTrigger className={TRIGGER_CLASS} aria-label="醫療分級">
                  <SelectValue placeholder="醫療分級" />
                </SelectTrigger>
                <SelectContent className={CONTENT_CLASS}>
                  {HOSPITAL_LEVEL_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value} className={ITEM_CLASS}>
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
                <SelectTrigger className={TRIGGER_CLASS} aria-label="科別">
                  <SelectValue placeholder="科別" />
                </SelectTrigger>
                <SelectContent className={cn(CONTENT_CLASS, "max-h-[320px]")}>
                  {DEPARTMENT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value} className={ITEM_CLASS}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          )}
        </div>
      </div>

      {/* 已套用篩選 chips */}
      {activeChips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">已套用</span>
          {activeChips.map((chip) => (
            <span
              key={chip.key}
              className="inline-flex items-center gap-1 rounded-full bg-accent py-1 pl-3 pr-1.5 text-xs font-medium text-accent-foreground"
            >
              {chip.label}
              <button
                type="button"
                onClick={chip.onRemove}
                className="rounded-full p-0.5 text-accent-foreground/70 transition-colors hover:bg-primary/15 hover:text-primary"
                aria-label={`移除 ${chip.label}`}
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
          <Button
            variant="ghost"
            size="xs"
            onClick={handleClearFilters}
            className="text-muted-foreground hover:text-primary"
          >
            清除全部
          </Button>
        </div>
      )}
    </div>
  );
}
