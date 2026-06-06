import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  AnnouncementsSection,
  ClinicDetailHeader,
  ClinicContactInfo,
  DepartmentBadges,
  DoctorTeamSection,
  ScheduleTimetable,
  ServicePreviewList,
  BusinessHoursSection,
  StickyBookingButton,
  BookingCard,
  WalkInCard,
} from "@/components/clinic-detail";
import {
  deriveFacilityType,
  parseCityFromAddress,
} from "@/lib/constants/clinic-constants";
import type {
  AnnouncementPublic,
  BusinessHours,
  Clinic,
  FacilityType,
  Member,
  PaymentType,
  Service,
} from "@/types/clinic";
import type { WeeklySchedule } from "@/types/schedule";

const API_BASE_URL = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// 星期對照表
const DAY_NAMES: Record<string, string> = {
  monday: "週一",
  tuesday: "週二",
  wednesday: "週三",
  thursday: "週四",
  friday: "週五",
  saturday: "週六",
  sunday: "週日",
};

// 角色名稱對照
const ROLE_NAMES: Record<string, string> = {
  doctor: "醫師",
  beautician: "美容師",
  therapist: "治療師",
};

interface ClinicDetailPageProps {
  params: Promise<{
    "clinic-id": string;
  }>;
}

// 將後端原始資料轉換為前端 Clinic 型別
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformClinicData(found: any): Clinic {
  const dayOrder = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
  const businessHours: BusinessHours[] | undefined = found.business_hours
    ? dayOrder
        .filter((day) => found.business_hours[day])
        .map((day) => ({
          day: DAY_NAMES[day] || day,
          open: found.business_hours[day].open,
          close: found.business_hours[day].close,
          is_closed: false,
        }))
    : undefined;

  const members: Member[] | undefined = found.members?.map(
    (s: {
      id: string;
      name: string;
      role: string;
      main_specialties?: string[];
      avatar_url?: string | null;
    }) => ({
      id: s.id,
      name: s.name,
      role: s.role as Member["role"],
      specialties: s.main_specialties,
      title: ROLE_NAMES[s.role] || s.role,
      avatar: s.avatar_url || undefined,
    }),
  );

  const departments = found.departments?.length
    ? found.departments
    : found.medical_department
      ? [found.medical_department]
      : [];

  return {
    id: found.id,
    clinic_name: found.name,
    hospital_level: found.hospital_level || "clinic",
    departments,
    phone: found.phone,
    address: found.address,
    city: parseCityFromAddress(found.address),
    facility_type:
      (found.facility_type as FacilityType | undefined) ??
      deriveFacilityType(members),
    payment_type: found.payment_type as PaymentType | undefined,
    logo: found.logo ?? null,
    rating: found.rating ?? undefined,
    review_count: found.review_count ?? undefined,
    business_hours: businessHours,
    members,
    online_booking_enabled: found.online_booking_enabled ?? true,
    phone_booking_enabled: found.phone_booking_enabled ?? false,
  };
}

async function getServicesFromApi(clinicId: string): Promise<Service[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/booking/clinics/${clinicId}/services`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    const raw = await res.json();
    return raw.map((item: { id: string; service_name?: string; name?: string; description?: string | null; price: string | number; duration_minutes?: number; category?: string }) => ({
      id: item.id,
      name: item.service_name ?? item.name ?? "",
      description: item.description ?? "",
      price: Number(item.price) || 0,
      duration_minutes: item.duration_minutes ?? 30,
      category: item.category ?? "一般服務",
    }));
  } catch {
    return [];
  }
}

async function getAnnouncementsFromApi(
  clinicId: string,
): Promise<AnnouncementPublic[]> {
  try {
    const res = await fetch(
      `${API_BASE_URL}/api/v1/booking/clinics/${clinicId}/announcements`,
      { cache: "no-store" },
    );
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

async function getScheduleFromApi(
  clinicId: string,
): Promise<WeeklySchedule | null> {
  try {
    const res = await fetch(
      `${API_BASE_URL}/api/v1/booking/clinics/${clinicId}/schedule`,
      { cache: "no-store" },
    );
    if (!res.ok) return null;
    return (await res.json()) as WeeklySchedule;
  } catch {
    return null;
  }
}

async function getClinicFromApi(clinicId: string): Promise<Clinic | null> {
  // 1. 優先嘗試 booking 單一院所端點
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/booking/clinics/${clinicId}`, {
      cache: "no-store",
    });
    if (res.ok) {
      const found = await res.json();
      return transformClinicData(found);
    }
  } catch {
    // 端點不存在或連線失敗，繼續嘗試下一個
  }

  // 2. Fallback: 從 booking 清單中查找
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/booking/clinics`, {
      cache: "no-store",
    });
    if (res.ok) {
      const clinics = await res.json();
      const found = clinics.find((c: { id: string }) => c.id === clinicId);
      if (found) return transformClinicData(found);
    }
  } catch {
    // 連線失敗
  }

  return null;
}

// 包進 React cache：generateMetadata 與頁面 body 共用同一次請求（即使 fetch no-store）
const getClinic = cache(getClinicFromApi);

// 繁中星期 → schema.org 英文星期（給 openingHoursSpecification）
const SCHEMA_DAY: Record<string, string> = {
  週一: "Monday",
  週二: "Tuesday",
  週三: "Wednesday",
  週四: "Thursday",
  週五: "Friday",
  週六: "Saturday",
  週日: "Sunday",
};

export async function generateMetadata({
  params,
}: ClinicDetailPageProps): Promise<Metadata> {
  const { "clinic-id": clinicId } = await params;
  const clinic = await getClinic(clinicId);
  if (!clinic) return { title: "找不到院所" };

  const place = `${clinic.city ?? ""}${clinic.address ?? ""}`.trim();
  const title = `${clinic.clinic_name}｜線上預約掛號`;
  const description =
    `${clinic.clinic_name}${place ? `（${place}）` : ""}線上預約掛號。` +
    `${clinic.phone ? `電話 ${clinic.phone}。` : ""}` +
    `查看門診時間、團隊與服務項目，免打電話直接線上預約。`;
  const path = `/clinic/${clinicId}`;

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName: "Cross",
      url: path,
      title: `${title} | Cross`,
      description,
      images: clinic.logo ? [{ url: clinic.logo }] : undefined,
    },
    twitter: {
      card: "summary",
      title: `${title} | Cross`,
      description,
      images: clinic.logo ? [clinic.logo] : undefined,
    },
  };
}

function buildClinicJsonLd(clinic: Clinic, clinicId: string) {
  const isBeauty =
    clinic.facility_type === "beauty" || clinic.facility_type === "aesthetic";
  const openingHours = (clinic.business_hours ?? [])
    .filter((h) => SCHEMA_DAY[h.day] && h.open && h.close)
    .map((h) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: SCHEMA_DAY[h.day],
      opens: h.open,
      closes: h.close,
    }));

  return {
    "@context": "https://schema.org",
    "@type": isBeauty ? "HealthAndBeautyBusiness" : "MedicalBusiness",
    name: clinic.clinic_name,
    url: `https://cross.twinhao.com/clinic/${clinicId}`,
    ...(clinic.logo ? { image: clinic.logo, logo: clinic.logo } : {}),
    ...(clinic.phone ? { telephone: clinic.phone } : {}),
    ...(clinic.address
      ? {
          address: {
            "@type": "PostalAddress",
            streetAddress: clinic.address,
            addressCountry: "TW",
            ...(clinic.city ? { addressLocality: clinic.city } : {}),
          },
        }
      : {}),
    ...(openingHours.length ? { openingHoursSpecification: openingHours } : {}),
    ...(clinic.rating != null &&
    clinic.review_count != null &&
    clinic.review_count > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: clinic.rating,
            reviewCount: clinic.review_count,
          },
        }
      : {}),
  };
}

export default async function ClinicDetailPage({ params }: ClinicDetailPageProps) {
  const { "clinic-id": clinicId } = await params;

  // 平行取得院所資訊、服務項目、門診排班與公告
  const [clinic, services, schedule, announcements] = await Promise.all([
    getClinic(clinicId),
    getServicesFromApi(clinicId),
    getScheduleFromApi(clinicId),
    getAnnouncementsFromApi(clinicId),
  ]);

  if (!clinic) {
    notFound();
  }

  // 合併服務項目到 clinic 資料
  if (services.length > 0) {
    clinic.services = services;
  }

  // 門診時刻表：健保、自費（皆有醫師 / 治療師排班）一律顯示（無資料呈現空狀態）；
  // 美容僅在確有排班時才顯示
  const showSchedule =
    schedule !== null &&
    (clinic.facility_type !== "aesthetic" || schedule.entries.length > 0);

  const jsonLd = buildClinicJsonLd(clinic, clinicId);

  return (
    <div className="min-h-screen bg-background pb-28 lg:pb-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Hero：裝飾性 banner + 院所識別卡 */}
      <ClinicDetailHeader clinic={clinic} />

      {/* 桌機雙欄：主內容 + 黏性側欄 */}
      <div className="container mx-auto px-4 pt-6 sm:px-6 sm:pt-8">
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
          {/* ===== 主內容 ===== */}
          <div className="space-y-6">
            {/* 公告（最多 3 則 active；無公告自動隱藏） */}
            <AnnouncementsSection announcements={announcements} />

            {/* 診療科別：僅看診大類顯示（元件內自動 gate，非看診回 null） */}
            <DepartmentBadges
              departments={clinic.departments}
              facilityType={clinic.facility_type}
            />

            {/* 門診時刻表（醫師排班：早/午/晚 × 週一~週日） */}
            {showSchedule && <ScheduleTimetable schedule={schedule} />}

            {/* 團隊成員 */}
            {clinic.members && clinic.members.length > 0 && (
              <DoctorTeamSection members={clinic.members} />
            )}

            {/* 服務項目 */}
            {clinic.services && clinic.services.length > 0 && (
              <ServicePreviewList services={clinic.services} />
            )}
          </div>

          {/* ===== 側欄（桌機黏性） ===== */}
          <aside className="space-y-6 lg:sticky lg:top-6">
            {/* 線上預約為付費功能：未開通的院所改顯示現場預約（電話由後台勾選才顯示） */}
            {clinic.online_booking_enabled ? (
              <BookingCard clinicId={clinicId} className="hidden lg:block" />
            ) : (
              <WalkInCard
                phone={clinic.phone}
                phoneBookingEnabled={clinic.phone_booking_enabled}
              />
            )}
            <ClinicContactInfo clinic={clinic} />
            {clinic.business_hours && clinic.business_hours.length > 0 && (
              <BusinessHoursSection businessHours={clinic.business_hours} />
            )}
          </aside>
        </div>
      </div>

      {/* 手機底部 sticky 預約 bar：僅開通線上預約的院所顯示（免費院所用側欄現場預約卡） */}
      {clinic.online_booking_enabled && (
        <StickyBookingButton clinicId={clinicId} />
      )}
    </div>
  );
}
