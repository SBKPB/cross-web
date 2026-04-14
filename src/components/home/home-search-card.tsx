"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { MapPin, Search, Sparkles, Stethoscope, Wallet } from "lucide-react";

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
  POPULAR_CHIPS_BY_TYPE,
  type PopularChip,
} from "@/lib/constants/clinic-constants";
import { cn } from "@/lib/utils";
import type { FacilityType } from "@/types/clinic";

const TABS: { value: FacilityType; label: string; icon: typeof Stethoscope }[] = [
  { value: "healthcare", label: "看診", icon: Stethoscope },
  { value: "aesthetic", label: "醫美", icon: Sparkles },
  { value: "self_pay", label: "自費", icon: Wallet },
];

const TAB_PLACEHOLDERS: Record<FacilityType, string> = {
  healthcare: "診所名稱、症狀或醫師…",
  aesthetic: "療程、醫師或品牌…例如「雷射」",
  self_pay: "健檢、疫苗、專科療程…",
};

export function HomeSearchCard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<FacilityType>("healthcare");
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("all");
  const [department, setDepartment] = useState("all");

  const popularChips = useMemo<PopularChip[]>(
    () => POPULAR_CHIPS_BY_TYPE[activeTab],
    [activeTab],
  );

  const buildSearchUrl = (overrides?: Partial<{ q: string; city: string; dept: string; type: FacilityType }>) => {
    const params = new URLSearchParams();
    const t = overrides?.type ?? activeTab;
    const q = overrides?.q ?? query;
    const c = overrides?.city ?? city;
    const d = overrides?.dept ?? department;
    if (t) params.set("type", t);
    if (q) params.set("q", q);
    if (c && c !== "all") params.set("city", c);
    if (d && d !== "all") params.set("dept", d);
    return `/search?${params.toString()}`;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    router.push(buildSearchUrl());
  };

  const handleChipClick = (chip: PopularChip) => {
    if (chip.kind === "dept") {
      router.push(buildSearchUrl({ dept: chip.value, q: "" }));
    } else {
      router.push(buildSearchUrl({ q: chip.value, dept: "all" }));
    }
  };

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-1 mb-3 max-w-md" role="tablist" aria-label="服務類型">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = tab.value === activeTab;
          return (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                "inline-flex items-center gap-1.5 px-4 py-2",
                "rounded-t-xl text-sm font-semibold",
                "transition-colors",
                active
                  ? "bg-white text-primary shadow-sm ring-1 ring-border/60 ring-b-0"
                  : "bg-white/40 text-muted-foreground hover:bg-white/70 hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 搜尋大卡 */}
      <form
        onSubmit={handleSubmit}
        className={cn(
          "flex flex-col md:flex-row gap-2 md:gap-1.5",
          "p-2 md:p-2",
          "rounded-2xl rounded-tl-none bg-white shadow-xl ring-1 ring-border/60",
        )}
      >
        {/* 關鍵字 */}
        <div className="relative flex-1 md:border-r md:border-border/60">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={TAB_PLACEHOLDERS[activeTab]}
            className={cn(
              "h-12 md:h-12 w-full pl-10 pr-4",
              "border-0 bg-transparent shadow-none",
              "text-base text-foreground placeholder:text-muted-foreground",
              "focus-visible:ring-0 focus-visible:border-transparent",
            )}
          />
        </div>

        {/* 城市 */}
        <div className="relative md:flex-1 md:min-w-[180px] md:border-r md:border-border/60">
          <MapPin className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
          <Select value={city} onValueChange={setCity}>
            <SelectTrigger
              className={cn(
                "!h-12 w-full pl-10 pr-4",
                "border-0 bg-transparent shadow-none",
                "text-base text-foreground",
                "focus:ring-0 focus:border-transparent",
                "data-[placeholder]:text-muted-foreground",
              )}
            >
              <SelectValue placeholder="選擇縣市" />
            </SelectTrigger>
            <SelectContent className="bg-white border-border text-foreground max-h-[300px]">
              {CITY_OPTIONS.map((opt) => (
                <SelectItem
                  key={opt.value}
                  value={opt.value}
                  className="focus:bg-accent focus:text-primary"
                >
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 科別（僅健保看診 tab 顯示） */}
        {activeTab === "healthcare" && (
          <div className="relative md:flex-1 md:min-w-[180px]">
            <Stethoscope className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
            <Select value={department} onValueChange={setDepartment}>
              <SelectTrigger
                className={cn(
                  "!h-12 w-full pl-10 pr-4",
                  "border-0 bg-transparent shadow-none",
                  "text-base text-foreground",
                  "focus:ring-0 focus:border-transparent",
                  "data-[placeholder]:text-muted-foreground",
                )}
              >
                <SelectValue placeholder="選擇科別" />
              </SelectTrigger>
              <SelectContent className="bg-white border-border text-foreground max-h-[300px]">
                {DEPARTMENT_OPTIONS.map((opt) => (
                  <SelectItem
                    key={opt.value}
                    value={opt.value}
                    className="focus:bg-accent focus:text-primary"
                  >
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* 送出 */}
        <Button
          type="submit"
          className={cn(
            "h-12 md:h-auto md:min-h-12 px-8 shrink-0",
            "rounded-xl bg-primary hover:bg-primary/90",
            "text-white text-base font-semibold",
            "shadow-sm",
          )}
        >
          <Search className="h-4 w-4 mr-1.5" />
          搜尋
        </Button>
      </form>

      {/* 熱門 chips（依 tab 切換） */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        <span className="text-xs text-muted-foreground mr-1">熱門</span>
        {popularChips.map((chip) => (
          <button
            key={`${chip.kind}-${chip.value}`}
            type="button"
            onClick={() => handleChipClick(chip)}
            className={cn(
              "inline-flex items-center px-3.5 py-1.5",
              "rounded-full text-sm font-medium",
              "bg-white/80 text-foreground ring-1 ring-border/60",
              "transition-all duration-150",
              "hover:bg-accent hover:text-primary hover:ring-primary/40 hover:-translate-y-0.5",
            )}
          >
            {chip.label}
          </button>
        ))}
      </div>
    </div>
  );
}
