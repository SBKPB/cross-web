// 診所詳情頁的資料抓取、轉換、metadata 與 JSON-LD（移植自舊 Next 的 app/clinic/[clinic-id]/page.tsx）。
// 後端一律經呼叫端傳入的 event.fetch 打 /api/v1（內部解析到代理路由），後端網址只在代理那一處。
// 純 TS 模組：node --test 直接 import，內部一律相對路徑。
import {
  categoryLabel,
  FALLBACK_TAXONOMY,
  facilityTypeLabel,
  serviceCategoriesApi,
  type ServiceTaxonomy,
} from "./api/service-categories.ts";
import { isDemoClinic } from "./clinic-discovery.ts";
import { deriveFacilityType, parseCityFromAddress } from "./constants/clinic-constants.ts";
import type { SeoProps } from "./components/Seo.svelte";
import type {
  AnnouncementPublic,
  BusinessHours,
  Clinic,
  ClinicDoctorDetail,
  FacilityType,
  Member,
  PaymentType,
  Service,
} from "./types/clinic.ts";
import type { WeeklySchedule } from "./types/schedule.ts";

type Fetch = typeof globalThis.fetch;

const SITE_URL = "https://cross.twinhao.com";

/** 診所專屬分享圖（og.png）的替代文字，同舊版 opengraph-image.tsx 的 alt */
export const CLINIC_OG_ALT = "診所線上預約掛號 — Cross";

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

/**
 * 子請求結果：失敗時照舊版以空值（[] / null）降級顯示，`ok` 記錄是否真的成功。
 * 降級的頁面不可進 CDN 快取（見 +page.server.ts）。
 */
interface Fetched<T> {
  value: T;
  ok: boolean;
}

/** 後端路徑：clinicId 來自網址，編碼後才放進路徑（避免 ../ 之類的值被解析成其他後端路徑） */
const clinicPath = (clinicId: string, suffix = "") =>
  `/api/v1/booking/clinics/${encodeURIComponent(clinicId)}${suffix}`;

// 將後端原始資料轉換為前端 Clinic 型別
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function transformClinicData(found: any): Clinic {
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

async function getDoctorsFromApi(fetch: Fetch, clinicId: string): Promise<Fetched<ClinicDoctorDetail[]>> {
  try {
    const res = await fetch(clinicPath(clinicId, "/doctors"));
    if (!res.ok) return { value: [], ok: false };
    const raw = await res.json();
    const value = raw.map(
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
    return { value, ok: true };
  } catch {
    return { value: [], ok: false };
  }
}

async function getServicesFromApi(fetch: Fetch, clinicId: string): Promise<Fetched<Service[]>> {
  try {
    const res = await fetch(clinicPath(clinicId, "/services"));
    if (!res.ok) return { value: [], ok: false };
    const raw = await res.json();
    const value = raw.map((item: { id: string; service_name?: string; name?: string; description?: string | null; price: string | number; show_price?: boolean; duration_minutes?: number; category?: string }) => ({
      id: item.id,
      name: item.service_name ?? item.name ?? "",
      description: item.description ?? "",
      price: Number(item.price) || 0,
      show_price: item.show_price !== false,
      duration_minutes: item.duration_minutes ?? 30,
      category: item.category ?? "一般服務",
    }));
    return { value, ok: true };
  } catch {
    return { value: [], ok: false };
  }
}

async function getAnnouncementsFromApi(fetch: Fetch, clinicId: string): Promise<Fetched<AnnouncementPublic[]>> {
  try {
    const res = await fetch(clinicPath(clinicId, "/announcements"));
    if (!res.ok) return { value: [], ok: false };
    return { value: await res.json(), ok: true };
  } catch {
    return { value: [], ok: false };
  }
}

async function getScheduleFromApi(fetch: Fetch, clinicId: string): Promise<Fetched<WeeklySchedule | null>> {
  try {
    const res = await fetch(clinicPath(clinicId, "/schedule"));
    if (!res.ok) return { value: null, ok: false };
    return { value: (await res.json()) as WeeklySchedule, ok: true };
  } catch {
    return { value: null, ok: false };
  }
}

async function getClinicFromApi(fetch: Fetch, clinicId: string): Promise<Clinic | null> {
  // 1. 優先嘗試 booking 單一院所端點
  try {
    const res = await fetch(clinicPath(clinicId));
    if (res.ok) {
      const found = await res.json();
      return transformClinicData(found);
    }
  } catch {
    // 端點不存在或連線失敗，繼續嘗試下一個
  }

  // 2. Fallback: 從 booking 清單中查找
  try {
    const res = await fetch("/api/v1/booking/clinics");
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

export interface ClinicDetail {
  /** null = 找不到院所（頁面回 404） */
  clinic: Clinic | null;
  schedule: WeeklySchedule | null;
  /** 門診時刻表是否顯示 */
  showSchedule: boolean;
  announcements: AnnouncementPublic[];
  doctorDetails: ClinicDoctorDetail[];
  /** 服務分類字彙（給 metadata / JSON-LD；元件內仍用 useServiceTaxonomy，同舊版 client 元件） */
  taxonomy: ServiceTaxonomy;
  /**
   * 降級渲染：服務、排班、公告、醫師任一子請求失敗（非 2xx、連線失敗或回應無法解析）而以空值顯示，
   * 或服務分類字彙退回內建 fallback。院所本身的請求不在此列（找不到即 404）
   */
  degraded: boolean;
}

/** 平行取得院所資訊、服務項目、門診排班、公告、醫師詳情與服務分類字彙（同舊版頁面） */
export async function loadClinicDetail(fetch: Fetch, clinicId: string): Promise<ClinicDetail> {
  const [clinic, services, schedule, announcements, doctors, taxonomy] = await Promise.all([
    getClinicFromApi(fetch, clinicId),
    getServicesFromApi(fetch, clinicId),
    getScheduleFromApi(fetch, clinicId),
    getAnnouncementsFromApi(fetch, clinicId),
    getDoctorsFromApi(fetch, clinicId),
    serviceCategoriesApi.get({ fetch }),
  ]);

  // 合併服務項目到 clinic 資料
  if (clinic && services.value.length > 0) {
    clinic.services = services.value;
  }

  // 門診時刻表：由院所後台「啟用門診時刻表」開關控制（看診預設開、美容/醫美等預設關，可切換）；
  // 開啟者有排班資料才顯示（無資料呈現空狀態）
  const showSchedule = !!clinic && clinic.show_schedule !== false && schedule.value !== null;

  // serviceCategoriesApi.get 失敗時回傳的就是 FALLBACK_TAXONOMY 本身（成功時是新解析的物件），以同一性判斷
  const degraded =
    [services, schedule, announcements, doctors].some((r) => !r.ok) || taxonomy === FALLBACK_TAXONOMY;

  return {
    clinic,
    schedule: schedule.value,
    showSchedule,
    announcements: announcements.value,
    doctorDetails: doctors.value,
    taxonomy,
    degraded,
  };
}

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

/**
 * 舊版 generateMetadata 的輸出，轉成 <Seo> 的 props（openGraph / twitter 整組取代全站值，同 Next 合併語意）。
 * 分享圖改指 /clinic/<id>/og.png，網域固定為正式站（舊版 metadataBase = SITE_URL，不隨請求來源變），
 * alt / 型別 / 尺寸同舊版 opengraph-image。
 */
export function buildClinicSeo(
  clinic: Clinic,
  clinicId: string,
  tax: ServiceTaxonomy,
): SeoProps {
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
  const demo = isDemoClinic(clinicId);

  return {
    title,
    description,
    noindex: demo,
    keywords: [clinic.clinic_name, ...labels, clinic.city ?? "", "線上預約", "掛號"]
      .filter(Boolean)
      .join("、"),
    canonical: path,
    openGraph: {
      type: "website",
      siteName: "Cross",
      url: `${SITE_URL}${path}`,
      title: `${title} | Cross`,
      description,
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | Cross`,
      description,
    },
    // 每間診所專屬動態分享卡（舊版由同目錄 opengraph-image.tsx 自動提供）
    image: {
      url: `${SITE_URL}${path}/og.png`,
      alt: CLINIC_OG_ALT,
      type: "image/png",
      width: 1200,
      height: 630,
    },
    // 示範院所不輸出結構化資料
    jsonLd: demo ? undefined : buildClinicJsonLd(clinic, clinicId, tax),
  };
}

export function buildClinicJsonLd(
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
