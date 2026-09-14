import type { Metadata } from "next";
import { PageIntro } from "@/components/public/page-intro";

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
    <div className="public-page min-h-screen bg-background flex flex-col">
      <SiteHeader />

      <main className="flex-1">
        <PageIntro compact eyebrow="EXPLORE / 找到適合的服務" title="搜尋店家" description="依地區、服務或專業人員搜尋，先了解，再安心預約。" />

        <div className="home-container py-3 pb-16 sm:py-6 sm:pb-24">
          <ClinicSearchView initialFilters={initialFilters} />
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
