"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";

import { ClinicList } from "@/components/clinics/clinic-list";
import { ClinicToolbar } from "@/components/clinics/clinic-toolbar";
import { clinicsApi } from "@/lib/api/clinics";
import type { Clinic, ClinicFilters } from "@/types/clinic";

interface ClinicSearchViewProps {
  initialFilters: ClinicFilters;
}

export function ClinicSearchView({ initialFilters }: ClinicSearchViewProps) {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<ClinicFilters>(initialFilters);

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
    return clinics.filter((clinic) => {
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
  }, [clinics, filters]);

  return (
    <div className="space-y-5">
      <ClinicToolbar filters={filters} onFiltersChange={setFilters} />

      <div className="text-sm text-muted-foreground">
        {isLoading ? "載入中..." : `共 ${filteredClinics.length} 間院所`}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <ClinicList clinics={filteredClinics} />
      )}
    </div>
  );
}
