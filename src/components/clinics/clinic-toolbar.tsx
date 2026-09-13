"use client";

import { useState } from "react";
import { Flower2, LayoutGrid, Search, SlidersHorizontal, Sparkles, Stethoscope, Store, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { categoriesFor, categoryLabel, facilityTypeLabel } from "@/lib/api/service-categories";
import { useServiceTaxonomy } from "@/lib/hooks/use-service-taxonomy";
import { CITY_OPTIONS, HOSPITAL_LEVEL_OPTIONS, HOSPITAL_LEVELS, PAYMENT_TYPES } from "@/lib/constants/clinic-constants";
import { cn } from "@/lib/utils";
import type { ClinicFilters, FacilityType } from "@/types/clinic";

interface ClinicToolbarProps {
  filters: ClinicFilters;
  onFiltersChange: (filters: ClinicFilters) => void;
  resultCount: number;
  className?: string;
}

const TABS = [
  { value: "all", label: "全部", icon: LayoutGrid },
  { value: "healthcare", icon: Stethoscope },
  { value: "aesthetic", icon: Sparkles },
  { value: "beauty", icon: Flower2 },
  { value: "other", icon: Store },
] as const;

export function ClinicToolbar({ filters, onFiltersChange, resultCount, className }: ClinicToolbarProps) {
  const taxonomy = useServiceTaxonomy();
  const [open, setOpen] = useState(false);
  const showLevel = filters.facilityType === "all" || filters.facilityType === "healthcare";
  const showPayment = filters.facilityType === "healthcare";
  const subcategories = filters.facilityType === "all"
    ? taxonomy.facility_types.flatMap((type) => type.categories)
    : categoriesFor(taxonomy, filters.facilityType);
  const advancedCount = filters.serviceCategories.length + Number(showLevel && filters.hospitalLevel !== "all") + Number(showPayment && filters.paymentType !== "all");
  const update = (patch: Partial<ClinicFilters>) => onFiltersChange({ ...filters, ...patch });
  const clearAdvanced = () => update({ hospitalLevel: "all", paymentType: "all", serviceCategories: [] });
  const toggleCategory = (code: string) => update({
    serviceCategories: filters.serviceCategories.includes(code)
      ? filters.serviceCategories.filter((item) => item !== code)
      : [...filters.serviceCategories, code],
  });
  const chips = [
    ...(filters.search ? [{ label: `「${filters.search}」`, remove: () => update({ search: "" }) }] : []),
    ...(filters.city !== "all" ? [{ label: filters.city, remove: () => update({ city: "all" }) }] : []),
    ...(showLevel && filters.hospitalLevel !== "all" ? [{ label: HOSPITAL_LEVELS[filters.hospitalLevel], remove: () => update({ hospitalLevel: "all" }) }] : []),
    ...(showPayment && filters.paymentType !== "all" ? [{ label: PAYMENT_TYPES[filters.paymentType], remove: () => update({ paymentType: "all" }) }] : []),
    ...filters.serviceCategories.map((code) => ({ label: categoryLabel(taxonomy, code), remove: () => toggleCategory(code) })),
  ];

  const advancedFields = (
    <div className="space-y-5">
      {showLevel && (
        <div className="space-y-2">
          <p className="text-sm font-medium">醫療分級</p>
          <Select value={filters.hospitalLevel} onValueChange={(value) => update({ hospitalLevel: value as ClinicFilters["hospitalLevel"] })}>
            <SelectTrigger className="!h-11 w-full rounded-xl md:w-48" aria-label="醫療分級"><SelectValue /></SelectTrigger>
            <SelectContent>{HOSPITAL_LEVEL_OPTIONS.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      )}
      {showPayment && (
        <div className="space-y-2">
          <p className="text-sm font-medium">付款方式</p>
          <div className="flex gap-2" role="group" aria-label="付款方式">
            {(["all", "nhi", "self_pay"] as const).map((value) => (
              <Button key={value} variant={filters.paymentType === value ? "default" : "outline"} className="h-11 rounded-full" aria-pressed={filters.paymentType === value} onClick={() => update({ paymentType: value })}>
                {value === "all" ? "全部" : PAYMENT_TYPES[value]}
              </Button>
            ))}
          </div>
        </div>
      )}
      <div className="space-y-2">
        <p className="text-sm font-medium">服務分類 <span className="font-normal text-muted-foreground">可複選</span></p>
        <div className="flex flex-wrap gap-2" role="group" aria-label="服務分類">
          {subcategories.map((category) => (
            <Button key={category.code} variant={filters.serviceCategories.includes(category.code) ? "default" : "secondary"} className="min-h-11 rounded-full px-3 text-sm md:min-h-9" aria-pressed={filters.serviceCategories.includes(category.code)} onClick={() => toggleCategory(category.code)}>
              {category.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className={cn("space-y-3 rounded-3xl bg-card p-3 shadow-sm ring-1 ring-border/60 sm:p-4", className)}>
      <div role="group" aria-label="服務類型" className="flex gap-1 overflow-x-auto rounded-2xl bg-secondary p-1">
        {TABS.map((tab) => (
          <button key={tab.value} type="button" aria-pressed={filters.facilityType === tab.value}
            onClick={() => update({ facilityType: tab.value, serviceCategories: [], hospitalLevel: tab.value === "all" || tab.value === "healthcare" ? filters.hospitalLevel : "all", paymentType: tab.value === "healthcare" ? filters.paymentType : "all" })}
            className={cn("inline-flex min-h-11 shrink-0 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-primary", filters.facilityType === tab.value ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground")}>
            <tab.icon className="hidden size-4 shrink-0 sm:block" />
            {tab.value === "all" ? "全部" : facilityTypeLabel(taxonomy, tab.value as FacilityType)}
          </button>
        ))}
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input aria-label="搜尋店家、醫師、服務分類或地址" placeholder="店家、醫師、服務分類或地址" value={filters.search} onChange={(event) => update({ search: event.target.value })} className="h-12 rounded-xl bg-secondary/50 pl-11 text-base" />
        </div>
        <div className="flex gap-2">
          <Select value={filters.city} onValueChange={(city) => update({ city })}>
            <SelectTrigger className="!h-12 min-w-0 flex-1 rounded-xl sm:w-40" aria-label="縣市"><SelectValue /></SelectTrigger>
            <SelectContent className="max-h-80">{CITY_OPTIONS.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
          </Select>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild><Button variant="outline" className="h-12 rounded-xl md:hidden"><SlidersHorizontal className="size-4" />篩選{advancedCount > 0 && <span className="rounded-full bg-primary px-2 text-primary-foreground">{advancedCount}</span>}</Button></SheetTrigger>
            <SheetContent side="bottom" className="max-h-[85dvh] rounded-t-3xl" showCloseButton={false}>
              <SheetHeader><div className="flex items-center justify-between"><SheetTitle>篩選店家</SheetTitle><SheetClose asChild><Button variant="ghost" size="icon" aria-label="關閉篩選"><X /></Button></SheetClose></div><SheetDescription>條件即時套用，可選擇多個服務分類。</SheetDescription></SheetHeader>
              <div className="overflow-y-auto px-6 pb-4">{advancedFields}</div>
              <SheetFooter className="border-t pb-[calc(1.5rem+env(safe-area-inset-bottom))]"><div className="flex gap-3"><Button variant="outline" className="h-12" onClick={clearAdvanced}>重設篩選</Button><SheetClose asChild><Button className="h-12 flex-1">查看 {resultCount} 間店家</Button></SheetClose></div></SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      </div>
      <details className="hidden rounded-xl border-t pt-3 md:block">
        <summary className="cursor-pointer text-sm font-medium text-muted-foreground">更多篩選{advancedCount > 0 ? `（${advancedCount}）` : ""}</summary>
        <div className="pt-4">{advancedFields}</div>
      </details>
      {chips.length > 0 && <div className="flex gap-2 overflow-x-auto pb-1" aria-label="已套用的篩選">
        {chips.map((chip, index) => <button key={`${chip.label}-${index}`} onClick={chip.remove} className="inline-flex min-h-9 shrink-0 items-center gap-1 rounded-full bg-accent px-3 text-sm text-accent-foreground" aria-label={`移除 ${chip.label}`}>{chip.label}<X className="size-3.5" /></button>)}
        <Button variant="ghost" className="h-9 shrink-0" onClick={() => onFiltersChange({ search: "", city: "all", hospitalLevel: "all", facilityType: "all", serviceCategories: [], paymentType: "all" })}>清除全部</Button>
      </div>}
    </div>
  );
}
