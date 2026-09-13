"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Flower2, LayoutGrid, Search, Sparkles, Stethoscope, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { categoriesFor, facilityTypeLabel } from "@/lib/api/service-categories";
import { useServiceTaxonomy } from "@/lib/hooks/use-service-taxonomy";
import { CITY_OPTIONS } from "@/lib/constants/clinic-constants";
import { cn } from "@/lib/utils";
import type { FacilityType } from "@/types/clinic";
import type { LandingClinic } from "@/lib/seo/landing-data";

const TABS = [
  { value: "all", icon: LayoutGrid },
  { value: "healthcare", icon: Stethoscope },
  { value: "aesthetic", icon: Sparkles },
  { value: "beauty", icon: Flower2 },
  { value: "other", icon: Store },
] as const;

export function HomeSearchCard({ availableClinics }: { availableClinics: LandingClinic[] }) {
  const router = useRouter();
  const taxonomy = useServiceTaxonomy();
  const [activeTab, setActiveTab] = useState<FacilityType | "all">("all");
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("all");
  const [category, setCategory] = useState("all");
  const categories = activeTab === "all" ? taxonomy.facility_types.flatMap((type) => type.categories) : categoriesFor(taxonomy, activeTab);
  const matchingClinics = availableClinics.filter((clinic) => (activeTab === "all" || clinic.facility_type === activeTab) && (city === "all" || clinic.city === city));
  const availableCodes = new Set(matchingClinics.flatMap((clinic) => clinic.departments));
  const shortcuts = categories.filter((item) => availableCodes.has(item.code)).slice(0, 5);
  const search = (categoryCode = category, keyword = query) => {
    const params = new URLSearchParams();
    if (activeTab !== "all") params.set("type", activeTab);
    if (keyword.trim()) params.set("q", keyword.trim());
    if (city !== "all") params.set("city", city);
    if (categoryCode !== "all") params.set("cat", categoryCode);
    router.push(`/search${params.size ? `?${params}` : ""}`);
  };
  const submit = (event: FormEvent) => { event.preventDefault(); search(); };

  return (
    <div className="rounded-3xl bg-card p-3 shadow-xl shadow-primary/5 ring-1 ring-border/70 sm:p-5">
      <div className="mb-4 flex gap-1 overflow-x-auto rounded-2xl bg-secondary/70 p-1" role="group" aria-label="服務類型">
        {TABS.map((tab) => <button key={tab.value} type="button" aria-pressed={activeTab === tab.value} onClick={() => { setActiveTab(tab.value); setCategory("all"); }} className={cn("inline-flex min-h-11 shrink-0 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-3 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-primary", activeTab === tab.value ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-card hover:text-foreground")}><tab.icon className="hidden size-4 shrink-0 sm:block" />{tab.value === "all" ? "全部" : facilityTypeLabel(taxonomy, tab.value)}</button>)}
      </div>
      <form onSubmit={submit} className="grid gap-3 md:grid-cols-[minmax(220px,2fr)_1fr_1fr_auto] md:items-end">
        <label className="space-y-1.5 text-sm font-medium"><span>想找什麼？</span><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="店家、醫師、服務分類或地址" className="h-12 rounded-xl bg-background text-base" /></label>
        <div className="grid grid-cols-2 gap-3 md:contents">
          <div className="space-y-1.5"><p className="text-sm font-medium">地區</p><Select value={city} onValueChange={setCity}><SelectTrigger aria-label="選擇縣市" className="!h-12 w-full rounded-xl bg-background"><SelectValue /></SelectTrigger><SelectContent className="max-h-80">{CITY_OPTIONS.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-1.5"><p className="text-sm font-medium">服務分類</p><Select value={category} onValueChange={setCategory}><SelectTrigger aria-label="選擇服務分類" className="!h-12 w-full rounded-xl bg-background"><SelectValue /></SelectTrigger><SelectContent className="max-h-80"><SelectItem value="all">全部項目</SelectItem>{categories.map((item) => <SelectItem key={item.code} value={item.code}>{item.label}</SelectItem>)}</SelectContent></Select></div>
        </div>
        <Button type="submit" className="h-12 rounded-xl px-6 text-base"><Search className="size-4" />搜尋店家</Button>
      </form>
      {shortcuts.length > 0 ? <div className="mt-4 flex flex-wrap items-center gap-2"><span className="text-sm text-muted-foreground">目前可找</span>{shortcuts.map((item) => <button key={item.code} type="button" onClick={() => search(item.code, "")} className="min-h-9 rounded-full bg-secondary px-3 text-sm hover:bg-accent hover:text-primary">{item.label}</button>)}</div> : (activeTab !== "all" || city !== "all") && <p className="mt-4 text-sm leading-relaxed text-muted-foreground" role="status">這個類型或地區目前尚無合作店家。可切換「全部」或選擇其他地區。</p>}
    </div>
  );
}
