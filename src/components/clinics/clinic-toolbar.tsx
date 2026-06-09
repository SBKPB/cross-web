"use client";

import {
  Flower2,
  LayoutGrid,
  Search,
  Sparkles,
  Stethoscope,
  Store,
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
  categoriesFor,
  categoryLabel,
} from "@/lib/api/service-categories";
import { useServiceTaxonomy } from "@/lib/hooks/use-service-taxonomy";
import {
  CITY_OPTIONS,
  HOSPITAL_LEVEL_OPTIONS,
  HOSPITAL_LEVELS,
  PAYMENT_TYPES,
} from "@/lib/constants/clinic-constants";
import { cn } from "@/lib/utils";
import type { ClinicFilters, FacilityType, PaymentType } from "@/types/clinic";

interface ClinicToolbarProps {
  filters: ClinicFilters;
  onFiltersChange: (filters: ClinicFilters) => void;
  className?: string;
}

// 頂層服務大類 tab（4 類，與首頁 Hero tabs 視覺一致）
// label 一律取自 taxonomy；icon 本地對照即可
const FACILITY_TAB_ICONS: Record<FacilityType, LucideIcon> = {
  healthcare: Stethoscope,
  aesthetic: Sparkles,
  beauty: Flower2,
  other: Store,
};

const FACILITY_TAB_ORDER: FacilityType[] = [
  "healthcare",
  "aesthetic",
  "beauty",
  "other",
];

// 付款方式篩選（僅看診大類顯示）：'all' | 健保 | 自費（不提供 both 當選項）
const PAYMENT_FILTER_OPTIONS: { value: ClinicFilters["paymentType"]; label: string }[] = [
  { value: "all", label: "全部" },
  { value: "nhi", label: PAYMENT_TYPES.nhi },
  { value: "self_pay", label: PAYMENT_TYPES.self_pay },
];

// select trigger 共用樣式：面板內 inset 風格（淺灰底、無外框陰影），hover 微亮
const TRIGGER_CLASS = cn(
  "!h-11 min-w-[128px] flex-1 rounded-xl border-transparent bg-secondary/70 px-4 text-sm",
  "transition-colors hover:bg-secondary sm:flex-none",
  "data-[placeholder]:text-muted-foreground",
);

// 留空交給 SelectContent 預設（bg-popover/text-popover-foreground），深色模式才正確
const CONTENT_CLASS = "";
const ITEM_CLASS = "focus:bg-accent focus:text-primary";

export function ClinicToolbar({
  filters,
  onFiltersChange,
  className,
}: ClinicToolbarProps) {
  const taxonomy = useServiceTaxonomy();

  // 看診大類才有「醫療分級」概念；全部 / 看診時顯示醫療分級 Select
  const showLevelFilter =
    filters.facilityType === "all" || filters.facilityType === "healthcare";

  // 第二層子類別 chip：選定某大類就顯示該大類子類別；
  // facilityType==='all' 時預設顯示看診科別（最常用情境）
  const subcategoryFacilityType: FacilityType =
    filters.facilityType === "all" ? "healthcare" : filters.facilityType;
  const subcategories = categoriesFor(taxonomy, subcategoryFacilityType);

  // 付款篩選：僅看診大類顯示
  const showPaymentFilter = filters.facilityType === "healthcare";

  const handleClearFilters = () => {
    onFiltersChange({
      search: "",
      hospitalLevel: "all",
      serviceCategories: [],
      city: "all",
      facilityType: "all",
      paymentType: "all",
    });
  };

  const handleFacilityType = (value: ClinicFilters["facilityType"]) => {
    const isLevelScope = value === "all" || value === "healthcare";
    const isHealthcare = value === "healthcare";
    onFiltersChange({
      ...filters,
      facilityType: value,
      // 切換大類時 reset 子類別（不同大類 code 集合不同）
      serviceCategories: [],
      // 非看診/全部時清掉醫療分級
      hospitalLevel: isLevelScope ? filters.hospitalLevel : "all",
      // 付款篩選僅看診大類有意義
      paymentType: isHealthcare ? filters.paymentType : "all",
    });
  };

  const toggleCategory = (code: string) => {
    const next = filters.serviceCategories.includes(code)
      ? filters.serviceCategories.filter((c) => c !== code)
      : [...filters.serviceCategories, code];
    onFiltersChange({ ...filters, serviceCategories: next });
  };

  // 已套用的篩選 chips（服務大類已用分段控制呈現，故不重複列入）
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
  if (showLevelFilter && filters.hospitalLevel !== "all") {
    activeChips.push({
      key: "level",
      label: HOSPITAL_LEVELS[filters.hospitalLevel],
      onRemove: () => onFiltersChange({ ...filters, hospitalLevel: "all" }),
    });
  }
  for (const code of filters.serviceCategories) {
    activeChips.push({
      key: `cat-${code}`,
      label: categoryLabel(taxonomy, code),
      onRemove: () =>
        onFiltersChange({
          ...filters,
          serviceCategories: filters.serviceCategories.filter((c) => c !== code),
        }),
    });
  }
  if (showPaymentFilter && filters.paymentType !== "all") {
    activeChips.push({
      key: "payment",
      label: PAYMENT_TYPES[filters.paymentType as PaymentType],
      onRemove: () => onFiltersChange({ ...filters, paymentType: "all" }),
    });
  }

  return (
    <div
      className={cn(
        "space-y-3 rounded-3xl bg-white p-3 ring-1 ring-border/60 shadow-sm sm:p-4",
        className,
      )}
    >
      {/* 服務大類分段控制（4 類 + 全部） */}
      <div
        role="tablist"
        aria-label="服務類型"
        className="inline-flex items-center gap-1 rounded-full bg-secondary p-1"
      >
        {/* 全部 */}
        <button
          type="button"
          role="tab"
          aria-selected={filters.facilityType === "all"}
          onClick={() => handleFacilityType("all")}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-all",
            filters.facilityType === "all"
              ? "bg-white text-primary shadow-sm ring-1 ring-border/60"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <LayoutGrid className="size-4" />
          全部
        </button>

        {FACILITY_TAB_ORDER.map((value) => {
          const active = filters.facilityType === value;
          const Icon = FACILITY_TAB_ICONS[value];
          const label =
            taxonomy.facility_types.find((f) => f.value === value)?.label ?? value;
          return (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => handleFacilityType(value)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-all",
                active
                  ? "bg-white text-primary shadow-sm ring-1 ring-border/60"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="size-4" />
              {label}
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
              "transition-colors hover:bg-secondary focus-visible:bg-background",
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

          {showLevelFilter && (
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
          )}
        </div>
      </div>

      {/* 付款方式篩選（僅看診大類） */}
      {showPaymentFilter && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-xs font-medium text-muted-foreground">
            付款方式
          </span>
          <div
            role="tablist"
            aria-label="付款方式"
            className="inline-flex items-center gap-1 rounded-full bg-secondary p-1"
          >
            {PAYMENT_FILTER_OPTIONS.map((opt) => {
              const active = filters.paymentType === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() =>
                    onFiltersChange({ ...filters, paymentType: opt.value })
                  }
                  className={cn(
                    "rounded-full px-3.5 py-1 text-sm font-medium transition-all",
                    active
                      ? "bg-white text-primary shadow-sm ring-1 ring-border/60"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 第二層子類別 chip（多選） */}
      {subcategories.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {subcategories.map((cat) => {
            const active = filters.serviceCategories.includes(cat.code);
            return (
              <button
                key={cat.code}
                type="button"
                aria-pressed={active}
                onClick={() => toggleCategory(cat.code)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium transition-all",
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-secondary/70 text-muted-foreground hover:bg-secondary hover:text-foreground",
                )}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      )}

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
