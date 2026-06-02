import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

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
  title: "搜尋店家",
  description: "搜尋全台健保、美容與自費合作店家，線上預約",
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
        {/* 搜尋頁 Hero：柔和漸層 + 光暈，與首頁視覺語言一致 */}
        <section className="relative overflow-hidden border-b border-border/60 bg-gradient-to-b from-sky-50 via-background to-background">
          <div className="pointer-events-none absolute -top-20 left-[12%] size-[360px] rounded-full bg-sky-200/40 blur-3xl" />
          <div className="pointer-events-none absolute -top-10 right-[14%] size-[320px] rounded-full bg-primary/10 blur-3xl" />
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.22]"
            style={{
              backgroundImage:
                "radial-gradient(circle, color-mix(in srgb, var(--primary) 16%, transparent) 1px, transparent 1px)",
              backgroundSize: "24px 24px",
              maskImage: "linear-gradient(to bottom, black, transparent 80%)",
              WebkitMaskImage: "linear-gradient(to bottom, black, transparent 80%)",
            }}
          />

          <div className="container relative mx-auto px-4 py-8 sm:py-10">
            <nav
              aria-label="麵包屑"
              className="mb-3 flex items-center gap-1 text-xs text-muted-foreground"
            >
              <Link href="/" className="transition-colors hover:text-primary">
                首頁
              </Link>
              <ChevronRight className="size-3.5 opacity-60" />
              <span className="font-medium text-foreground">搜尋店家</span>
            </nav>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              搜尋店家
            </h1>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground sm:text-base">
              依健保、自費、美容三大類型搜尋，找到最適合你的合作店家。
            </p>
          </div>
        </section>

        <div className="container mx-auto px-4 py-6 sm:py-8">
          <ClinicSearchView initialFilters={initialFilters} />
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
