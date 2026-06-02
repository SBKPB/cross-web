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
  department: "all",
  city: "all",
  facilityType: "all",
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
      if (
        filters.hospitalLevel !== "all" &&
        clinic.hospital_level !== filters.hospitalLevel
      ) {
        return false;
      }
      if (
        filters.department !== "all" &&
        !clinic.departments.includes(filters.department)
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
      return true;
    });

    if (sort === "rating") {
      result.sort((a, b) => (b.rating ?? -1) - (a.rating ?? -1));
    } else if (sort === "name") {
      result.sort((a, b) => a.clinic_name.localeCompare(b.clinic_name, "zh-Hant"));
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
          <SelectContent className="bg-white border-border text-foreground">
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
