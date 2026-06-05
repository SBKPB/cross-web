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
  PaymentType,
} from "@/types/clinic";

export const metadata: Metadata = {
  title: "搜尋店家",
  description: "搜尋全台看診、醫美、美容與其他合作店家，線上預約",
};

interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
    city?: string;
    dept?: string; // 舊版單一子類別 code（向後相容）
    cat?: string; // 新版多個子類別 code，逗號分隔
    level?: string;
    type?: string;
    payment?: string; // 'nhi' | 'self_pay'
  }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const sp = await searchParams;

  // 服務大類與付款方式：向後相容舊連結帶進的 type=self_pay
  // FacilityType 已無 self_pay，舊值映射為「看診 + 自費付款」
  const rawType = sp.type;
  let facilityType: FacilityType | "all";
  let paymentTypeFromType: PaymentType | "all" = "all";
  if (rawType === "self_pay") {
    facilityType = "healthcare";
    paymentTypeFromType = "self_pay";
  } else {
    facilityType = rawType ? (rawType as FacilityType) : "all";
  }

  // 子類別：cat（多值，逗號分隔）優先，否則 fallback 舊 dept（單值）
  const serviceCategories = sp.cat
    ? sp.cat
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean)
    : sp.dept
      ? [sp.dept]
      : [];

  // 付款方式：明確的 payment 參數優先，其次才是 type=self_pay 的映射
  const rawPayment: PaymentType | "all" =
    (sp.payment as PaymentType | undefined) ?? paymentTypeFromType;

  // 依 facilityType 正規化不適用的篩選軸，避免一進頁就帶入「看不見也移不掉」的隱形篩選：
  // - 付款方式只在「看診」大類有效
  // - 醫療分級只在「看診/全部」大類有效
  const levelScope = facilityType === "all" || facilityType === "healthcare";
  const initialFilters: ClinicFilters = {
    search: sp.q ?? "",
    city: sp.city ?? "all",
    serviceCategories,
    hospitalLevel: levelScope ? ((sp.level as HospitalLevel) ?? "all") : "all",
    facilityType,
    paymentType: facilityType === "healthcare" ? rawPayment : "all",
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
              依看診、醫美、美容、其他四大類型搜尋，找到最適合你的合作店家。
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
