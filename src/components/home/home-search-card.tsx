"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import {
  Flower2,
  MapPin,
  Search,
  Sparkles,
  Stethoscope,
  Store,
  Tag,
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
import { categoriesFor, facilityTypeLabel } from "@/lib/api/service-categories";
import { useServiceTaxonomy } from "@/lib/hooks/use-service-taxonomy";
import { CITY_OPTIONS } from "@/lib/constants/clinic-constants";
import { cn } from "@/lib/utils";
import type { FacilityType } from "@/types/clinic";

// 大類 tab（4 類，與 FacilityType 對齊；無 self_pay，自費屬付款軸）
// label 仍由 taxonomy 提供（healthcare→「看診」），icon 在此固定。
const TABS: { value: FacilityType; icon: typeof Stethoscope }[] = [
  { value: "healthcare", icon: Stethoscope },
  { value: "aesthetic", icon: Sparkles },
  { value: "beauty", icon: Flower2 },
  { value: "other", icon: Store },
];

// 各大類關鍵字輸入框 placeholder（剛好 4 key，型別強制無 self_pay）
const TAB_PLACEHOLDERS: Record<FacilityType, string> = {
  healthcare: "診所名稱、症狀或醫師…",
  aesthetic: "療程或品牌…例如「雷射」「電波」",
  beauty: "美容、美甲、美睫、紋繡、SPA…",
  other: "傳統整復、推拿或其他健康服務…",
};

export function HomeSearchCard() {
  const router = useRouter();
  const taxonomy = useServiceTaxonomy();

  const [activeTab, setActiveTab] = useState<FacilityType>("healthcare");
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("all");
  // 第二層子類別（service_category code）；'all'=不限
  const [category, setCategory] = useState("all");

  // 當前大類底下的子類別（吃 taxonomy）
  const categories = useMemo(
    () => categoriesFor(taxonomy, activeTab),
    [taxonomy, activeTab],
  );

  // 切換大類時清掉第二層選擇，避免帶錯 code 進搜尋
  const switchTab = (value: FacilityType) => {
    setActiveTab(value);
    setCategory("all");
  };

  // 組搜尋 URL：
  //   type    → 大類 FacilityType
  //   q       → 自由關鍵字
  //   city    → 縣市
  //   cat     → service_category code（可逗號分隔多個；此處單選）
  const buildSearchUrl = (
    overrides?: Partial<{
      q: string;
      city: string;
      cat: string;
      type: FacilityType;
    }>,
  ) => {
    const params = new URLSearchParams();
    const t = overrides?.type ?? activeTab;
    const q = overrides?.q ?? query;
    const c = overrides?.city ?? city;
    const cat = overrides?.cat ?? category;
    if (t) params.set("type", t);
    if (q) params.set("q", q);
    if (c && c !== "all") params.set("city", c);
    if (cat && cat !== "all") params.set("cat", cat);
    return `/search?${params.toString()}`;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    router.push(buildSearchUrl());
  };

  // 第二層子類別 chip：一律帶 service_category code（不再用自由 query 文字）
  const handleCategoryChip = (code: string) => {
    setCategory(code);
    router.push(buildSearchUrl({ cat: code, q: "" }));
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
              onClick={() => switchTab(tab.value)}
              className={cn(
                "inline-flex items-center gap-1.5 px-4 py-2",
                "rounded-t-xl text-sm font-semibold",
                "transition-colors",
                active
                  ? "bg-card text-primary shadow-sm ring-1 ring-border/60 ring-b-0"
                  : "bg-card/40 text-muted-foreground hover:bg-card/70 hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {facilityTypeLabel(taxonomy, tab.value)}
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
          // 玻璃主角：坐在 hero 光暈上，透出後面的顏色才有厚度感
          "glass rounded-2xl rounded-tl-none",
        )}
      >
        {/* 關鍵字 —— flex-[2] 讓它拿到約兩倍於下拉選單的寬度。
            原本四個欄位平分 max-w-3xl，關鍵字只剩約 100px，
            placeholder「診所名稱、症狀或醫師…」會被截成「診所名」。 */}
        <div className="relative md:flex-[2] md:min-w-[220px] md:border-r md:border-border/60">
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
        <div className="relative md:flex-1 md:min-w-[130px] md:border-r md:border-border/60">
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
            <SelectContent className="max-h-[300px]">
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

        {/* 子類別（依大類 taxonomy 動態）— 帶 service_category code */}
        <div className="relative md:flex-1 md:min-w-[130px] md:border-r md:border-border/60">
          <Tag className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger
              className={cn(
                "!h-12 w-full pl-10 pr-4",
                "border-0 bg-transparent shadow-none",
                "text-base text-foreground",
                "focus:ring-0 focus:border-transparent",
                "data-[placeholder]:text-muted-foreground",
              )}
            >
              <SelectValue placeholder="選擇項目" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              <SelectItem
                value="all"
                className="focus:bg-accent focus:text-primary"
              >
                全部項目
              </SelectItem>
              {categories.map((c) => (
                <SelectItem
                  key={c.code}
                  value={c.code}
                  className="focus:bg-accent focus:text-primary"
                >
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 付款方式（健保 / 自費）已從首頁移除：它只在 4 個大類中的「看診」有意義，
            卻永久佔掉一欄寬度，把主要的關鍵字欄擠到不能用。篩選留在 /search 的
            工具列，該處空間充足且本來就是做篩選的地方。 */}

        {/* 送出 */}
        <Button
          type="submit"
          className={cn(
            "h-12 md:h-auto md:min-h-12 px-8 shrink-0",
            "rounded-xl bg-primary hover:bg-primary/90",
            "text-primary-foreground text-base font-semibold",
            "shadow-sm",
          )}
        >
          <Search className="h-4 w-4 mr-1.5" />
          搜尋
        </Button>
      </form>

      {/* 熱門子類別 chips（依大類切換，帶 service_category code） */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        <span className="text-xs text-muted-foreground mr-1">熱門</span>
        {categories.slice(0, 7).map((c) => (
          <button
            key={c.code}
            type="button"
            onClick={() => handleCategoryChip(c.code)}
            className={cn(
              "inline-flex items-center px-3.5 py-1.5",
              "rounded-full text-sm font-medium",
              "bg-card/80 text-foreground ring-1 ring-border/60",
              "transition-all duration-150",
              "hover:bg-accent hover:text-primary hover:ring-primary/40 hover:-translate-y-0.5",
            )}
          >
            {c.label}
          </button>
        ))}
      </div>
    </div>
  );
}
