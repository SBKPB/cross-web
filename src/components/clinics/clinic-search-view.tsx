"use client";

import { useEffect, useMemo, useState } from "react";

import { ClinicList, ClinicListSkeleton } from "@/components/clinics/clinic-list";
import { ClinicToolbar } from "@/components/clinics/clinic-toolbar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { clinicsApi } from "@/lib/api/clinics";
import type { Clinic, ClinicFilters } from "@/types/clinic";

interface ClinicSearchViewProps {
  initialFilters: ClinicFilters;
}

type SortKey = "default" | "rating" | "name";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "default", label: "預設排序" },
  { value: "rating", label: "評分最高" },
  { value: "name", label: "名稱排序" },
];

const EMPTY_FILTERS: ClinicFilters = {
  search: "",
  hospitalLevel: "all",
  serviceCategories: [],
  city: "all",
  facilityType: "all",
  paymentType: "all",
};

export function ClinicSearchView({ initialFilters }: ClinicSearchViewProps) {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<ClinicFilters>(initialFilters);
  const [sort, setSort] = useState<SortKey>("default");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await clinicsApi.getClinics();
        if (!cancelled) setClinics(data);
      } catch (error) {
        console.error("[Search] Failed to fetch clinics:", error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredClinics = useMemo(() => {
    const result = clinics.filter((clinic) => {
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const nameHit = clinic.clinic_name.toLowerCase().includes(q);
        const addrHit = clinic.address?.toLowerCase().includes(q) ?? false;
        if (!nameHit && !addrHit) return false;
      }
      // 醫療分級僅在「看診/全部」大類適用（與 toolbar 的 showLevelFilter 一致，
      // 避免非看診大類帶 level 參數時產生看不見、移不掉的隱形篩選）
      const levelScope =
        filters.facilityType === "all" || filters.facilityType === "healthcare";
      if (
        levelScope &&
        filters.hospitalLevel !== "all" &&
        clinic.hospital_level !== filters.hospitalLevel
      ) {
        return false;
      }
      // 第二層子類別（多選，OR 命中）：空陣列=不限
      if (
        filters.serviceCategories.length > 0 &&
        !filters.serviceCategories.some((c) => clinic.departments.includes(c))
      ) {
        return false;
      }
      if (filters.city !== "all" && clinic.city !== filters.city) {
        return false;
      }
      if (
        filters.facilityType !== "all" &&
        clinic.facility_type !== filters.facilityType
      ) {
        return false;
      }
      // 付款方式僅在「看診」大類適用（與 toolbar 的 showPaymentFilter 一致，
      // 避免非看診大類帶 payment 參數時產生隱形篩選）。
      // 健保命中 nhi+both、自費命中 self_pay+both（缺值視為 nhi）
      if (filters.facilityType === "healthcare" && filters.paymentType !== "all") {
        const pt = clinic.payment_type ?? "nhi";
        const hit =
          filters.paymentType === "nhi"
            ? pt === "nhi" || pt === "both"
            : pt === "self_pay" || pt === "both";
        if (!hit) return false;
      }
      return true;
    });

    // 精選置頂（付費曝光）一律排最前，再套用使用者選的排序作為次要鍵。
    // default 模式下次要鍵維持後端順序（後端已依 featured → created_at desc）。
    const featuredRank = (c: Clinic) => (c.is_featured ? 0 : 1);
    if (sort === "rating") {
      result.sort(
        (a, b) =>
          featuredRank(a) - featuredRank(b) ||
          (b.rating ?? -1) - (a.rating ?? -1),
      );
    } else if (sort === "name") {
      result.sort(
        (a, b) =>
          featuredRank(a) - featuredRank(b) ||
          a.clinic_name.localeCompare(b.clinic_name, "zh-Hant"),
      );
    } else {
      result.sort((a, b) => featuredRank(a) - featuredRank(b));
    }

    return result;
  }, [clinics, filters, sort]);

  return (
    <div className="space-y-5">
      {/* 黏性工具列：捲動時固定於頁首下方，方便隨時調整篩選 */}
      <div className="sticky top-16 z-30 -mx-4 bg-background/80 px-4 py-3 backdrop-blur">
        <ClinicToolbar filters={filters} onFiltersChange={setFilters} />
      </div>

      {/* 結果計數 + 排序 */}
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {isLoading ? (
            "載入店家中…"
          ) : (
            <>
              共{" "}
              <span className="font-semibold text-foreground">
                {filteredClinics.length}
              </span>{" "}
              間店家
            </>
          )}
        </p>

        <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
          <SelectTrigger
            size="sm"
            className="w-[132px] rounded-full border-transparent bg-white ring-1 ring-border/60"
            aria-label="排序方式"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((opt) => (
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

      {isLoading ? (
        <ClinicListSkeleton />
      ) : (
        <ClinicList
          clinics={filteredClinics}
          onReset={() => setFilters(EMPTY_FILTERS)}
        />
      )}
    </div>
  );
}
