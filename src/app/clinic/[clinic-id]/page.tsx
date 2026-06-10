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
  RecordView,
} from "@/components/clinic-detail";
import {
  deriveFacilityType,
  parseCityFromAddress,
} from "@/lib/constants/clinic-constants";
import {
  categoryLabel,
  facilityTypeLabel,
  serviceCategoriesApi,
  type ServiceTaxonomy,
} from "@/lib/api/service-categories";
import type {
  AnnouncementPublic,
  BusinessHours,
  Clinic,
  ClinicDoctorDetail,
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
    description: found.description ?? undefined,
    latitude: found.latitude ?? null,
    longitude: found.longitude ?? null,
    rating: found.rating ?? undefined,
    review_count: found.review_count ?? undefined,
    is_featured: found.is_featured ?? false,
    business_hours: businessHours,
    members,
    online_booking_enabled: found.online_booking_enabled ?? true,
    phone_booking_enabled: found.phone_booking_enabled ?? false,
    show_schedule: found.show_schedule ?? true,
  };
}

async function getDoctorsFromApi(
  clinicId: string,
): Promise<ClinicDoctorDetail[]> {
  try {
    const res = await fetch(
      `${API_BASE_URL}/api/v1/booking/clinics/${clinicId}/doctors`,
      { cache: "no-store" },
    );
    if (!res.ok) return [];
    const raw = await res.json();
    return raw.map(
      (d: {
        id: string;
        name: string;
        department?: string;
        avatar_url?: string | null;
        main_specialties?: string[];
        role?: string;
        education?: string[];
        experience?: string[];
        license_type?: string | null;
      }): ClinicDoctorDetail => ({
        id: d.id,
        name: d.name,
        role: d.role ?? "doctor",
        // 後端 department 預設值為「醫師」佔位，視為未填
        department:
          d.department && d.department !== "醫師" ? d.department : undefined,
        avatar: d.avatar_url ?? undefined,
        specialties: d.main_specialties ?? [],
        education: d.education ?? [],
        experience: d.experience ?? [],
        license_type: d.license_type ?? undefined,
      }),
    );
  } catch {
    return [];
  }
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

const SITE_URL = "https://cross.twinhao.com";

// 院所服務分類 code → 中文 label（最多取前 3 個，給 SEO 關鍵字 / medicalSpecialty）
function clinicCategoryLabels(clinic: Clinic, tax: ServiceTaxonomy): string[] {
  return (clinic.departments ?? [])
    .map((code) => categoryLabel(tax, code))
    .filter((l) => l && l !== "other" && l !== "其他")
    .slice(0, 3);
}

// 在地關鍵字：城市 + 主科別/服務型態（如「台北市皮膚科」「台中市醫美」）
function localKeyword(clinic: Clinic, tax: ServiceTaxonomy): string {
  const city = clinic.city ?? "";
  const labels = clinicCategoryLabels(clinic, tax);
  const primary =
    labels[0] ??
    (clinic.facility_type
      ? facilityTypeLabel(tax, clinic.facility_type)
      : "");
  return `${city}${primary}`.trim();
}

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
  const [clinic, tax] = await Promise.all([
    getClinic(clinicId),
    serviceCategoriesApi.get(),
  ]);
  if (!clinic) return { title: "找不到院所" };

  const isHealthcare = clinic.facility_type === "healthcare";
  const action = isHealthcare ? "線上預約掛號" : "線上預約";
  const keyword = localKeyword(clinic, tax); // 城市 + 主科別/服務型態
  const labels = clinicCategoryLabels(clinic, tax);
  const place = `${clinic.city ?? ""}${clinic.address ?? ""}`.trim();

  // title 帶入在地關鍵字（城市+主科別），命中「地區+科別」搜尋意圖
  const title = keyword
    ? `${clinic.clinic_name}｜${keyword}${action}`
    : `${clinic.clinic_name}｜${action}`;

  // description 優先用診所自我介紹（差異化內容），否則組合在地資訊
  const intro = clinic.description?.trim();
  const description = intro
    ? intro.slice(0, 150)
    : `${clinic.clinic_name}${place ? `（${place}）` : ""}${action}。` +
      `${labels.length ? `服務項目：${labels.join("、")}。` : ""}` +
      `${clinic.phone ? `電話 ${clinic.phone}。` : ""}` +
      `查看門診時間、醫師團隊與服務項目，免打電話直接線上預約。`;
  const path = `/clinic/${clinicId}`;

  return {
    title,
    description,
    keywords: [clinic.clinic_name, ...labels, clinic.city ?? "", "線上預約", "掛號"]
      .filter(Boolean)
      .join("、"),
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName: "Cross",
      url: `${SITE_URL}${path}`,
      title: `${title} | Cross`,
      description,
      // og:image 由同目錄 opengraph-image.tsx（每間診所專屬動態分享卡）自動提供
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | Cross`,
      description,
    },
  };
}

function buildClinicJsonLd(
  clinic: Clinic,
  clinicId: string,
  tax: ServiceTaxonomy,
) {
  const isBeauty =
    clinic.facility_type === "beauty" || clinic.facility_type === "aesthetic";
  // 看診用更精確的 MedicalClinic（MedicalBusiness + LocalBusiness 子型別）；
  // 醫美/美容維持 HealthAndBeautyBusiness。
  const businessType = isBeauty ? "HealthAndBeautyBusiness" : "MedicalClinic";
  const url = `${SITE_URL}/clinic/${clinicId}`;

  const openingHours = (clinic.business_hours ?? [])
    .filter((h) => SCHEMA_DAY[h.day] && h.open && h.close)
    .map((h) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: SCHEMA_DAY[h.day],
      opens: h.open,
      closes: h.close,
    }));

  const specialties = clinicCategoryLabels(clinic, tax);

  // 醫師團隊 → Physician（強化醫療 E-E-A-T）
  const physicians = (clinic.members ?? [])
    .filter((m) => m.role === "doctor")
    .map((m) => ({
      "@type": "Physician",
      name: m.name,
      ...(m.specialties?.length
        ? { medicalSpecialty: m.specialties.join("、") }
        : {}),
      worksFor: { "@id": url },
    }));

  const business = {
    "@type": businessType,
    "@id": url,
    name: clinic.clinic_name,
    url,
    ...(clinic.description ? { description: clinic.description } : {}),
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
    ...(clinic.latitude != null && clinic.longitude != null
      ? {
          geo: {
            "@type": "GeoCoordinates",
            latitude: clinic.latitude,
            longitude: clinic.longitude,
          },
        }
      : {}),
    ...(clinic.city ? { areaServed: clinic.city } : {}),
    ...(!isBeauty && specialties.length
      ? { medicalSpecialty: specialties }
      : {}),
    ...(physicians.length ? { employee: physicians } : {}),
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

  // 麵包屑：首頁 > 診所搜尋 > 診所名（爭取麵包屑 rich result）
  const breadcrumb = {
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "首頁", item: SITE_URL },
      {
        "@type": "ListItem",
        position: 2,
        name: "診所搜尋",
        item: `${SITE_URL}/search`,
      },
      { "@type": "ListItem", position: 3, name: clinic.clinic_name, item: url },
    ],
  };

  return {
    "@context": "https://schema.org",
    "@graph": [business, breadcrumb],
  };
}

export default async function ClinicDetailPage({ params }: ClinicDetailPageProps) {
  const { "clinic-id": clinicId } = await params;

  // 平行取得院所資訊、服務項目、門診排班、公告、醫師詳情與服務分類字彙
  const [clinic, services, schedule, announcements, doctorDetails, tax] =
    await Promise.all([
      getClinic(clinicId),
      getServicesFromApi(clinicId),
      getScheduleFromApi(clinicId),
      getAnnouncementsFromApi(clinicId),
      getDoctorsFromApi(clinicId),
      serviceCategoriesApi.get(),
    ]);

  if (!clinic) {
    notFound();
  }

  // 合併服務項目到 clinic 資料
  if (services.length > 0) {
    clinic.services = services;
  }

  // 門診時刻表：由院所後台「啟用門診時刻表」開關控制（看診預設開、美容/醫美等預設關，可切換）；
  // 開啟者有排班資料才顯示（無資料呈現空狀態）
  const showSchedule = clinic.show_schedule !== false && schedule !== null;

  const jsonLd = buildClinicJsonLd(clinic, clinicId, tax);

  return (
    <div className="min-h-screen bg-background pb-28 lg:pb-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* 記錄一次瀏覽（登入會員，跨裝置同步；純副作用） */}
      <RecordView clinicId={clinicId} />

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

            {/* 團隊成員（點擊顯示詳情） */}
            {clinic.members && clinic.members.length > 0 && (
              <DoctorTeamSection
                members={clinic.members}
                details={doctorDetails}
              />
            )}

            {/* 服務項目 */}
            {clinic.services && clinic.services.length > 0 && (
              <ServicePreviewList
                services={clinic.services}
                paymentType={clinic.payment_type}
              />
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
