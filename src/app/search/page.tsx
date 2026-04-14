import type { Metadata } from "next";

import { ClinicSearchView } from "@/components/clinics/clinic-search-view";
import { SiteFooter } from "@/components/home/site-footer";
import { SiteHeader } from "@/components/home/site-header";
import type {
  ClinicFilters,
  FacilityType,
  HospitalLevel,
  MedicalDepartment,
} from "@/types/clinic";

export const metadata: Metadata = {
  title: "搜尋診所 | Cross",
  description: "搜尋全台醫療院所，線上預約掛號",
};

interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
    city?: string;
    dept?: string;
    level?: string;
    type?: string;
  }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const sp = await searchParams;

  const initialFilters: ClinicFilters = {
    search: sp.q ?? "",
    city: sp.city ?? "all",
    department: (sp.dept as MedicalDepartment) ?? "all",
    hospitalLevel: (sp.level as HospitalLevel) ?? "all",
    facilityType: (sp.type as FacilityType) ?? "all",
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />

      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1">
              搜尋診所
            </h1>
            <p className="text-sm text-muted-foreground">
              輸入關鍵字、挑選縣市與科別，找到最適合的醫療院所
            </p>
          </div>
          <ClinicSearchView initialFilters={initialFilters} />
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
