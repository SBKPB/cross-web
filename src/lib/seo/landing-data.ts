import { api, MissingFetchError } from "../api/client.ts";
import { parseCityFromAddress } from "../constants/clinic-constants.ts";
import { isDemoClinic } from "../clinic-discovery.ts";
import type { FacilityType, PaymentType } from "../types/clinic.ts";

export interface LandingClinic {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  departments: string[];
  facility_type?: FacilityType;
  payment_type?: PaymentType;
  logo: string | null;
  phone: string | null;
  is_featured: boolean;
}

interface RawClinic {
  id: string;
  name: string;
  address?: string | null;
  departments?: string[];
  facility_type?: FacilityType;
  payment_type?: PaymentType;
  logo?: string | null;
  phone?: string | null;
  is_featured?: boolean;
}

/** 取得所有公開診所（在地落地頁共用；快取由頁面 setHeaders 控制）。server 端 load 須傳入 SvelteKit 的 fetch */
export async function getAllClinics(opts?: { fetch?: typeof globalThis.fetch }): Promise<LandingClinic[]> {
  try {
    const raw = await api.get<RawClinic[]>("/api/v1/booking/clinics", opts);
    return raw.filter((c) => !isDemoClinic(c.id)).map((c) => ({
      id: c.id,
      name: c.name,
      address: c.address ?? null,
      city: parseCityFromAddress(c.address ?? undefined) ?? null,
      departments: c.departments ?? [],
      facility_type: c.facility_type,
      payment_type: c.payment_type,
      logo: c.logo ?? null,
      phone: c.phone ?? null,
      is_featured: c.is_featured ?? false,
    }));
  } catch (e) {
    // 與舊版相同：任何錯誤都回空清單；唯獨 server 端漏傳 fetch 是程式錯誤，必須穿透（見 client.ts）
    if (e instanceof MissingFetchError) throw e;
    return [];
  }
}

/** 精選優先、其次名稱排序（落地頁列表用） */
export function sortForListing(clinics: LandingClinic[]): LandingClinic[] {
  return [...clinics].sort(
    (a, b) =>
      Number(b.is_featured) - Number(a.is_featured) ||
      a.name.localeCompare(b.name, "zh-Hant"),
  );
}

/** 各縣市 → 診所數（依數量多到少） */
export function citiesWithCounts(
  clinics: LandingClinic[],
): { city: string; count: number }[] {
  const map = new Map<string, number>();
  for (const c of clinics) {
    if (!c.city) continue;
    map.set(c.city, (map.get(c.city) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([city, count]) => ({ city, count }))
    .sort((a, b) => b.count - a.count || a.city.localeCompare(b.city, "zh-Hant"));
}

/** 各服務子類別 code → 診所數（依數量多到少） */
export function categoriesWithCounts(
  clinics: LandingClinic[],
): { code: string; count: number }[] {
  const map = new Map<string, number>();
  for (const c of clinics) {
    for (const code of c.departments) {
      if (!code || code === "other") continue;
      map.set(code, (map.get(code) ?? 0) + 1);
    }
  }
  return [...map.entries()]
    .map(([code, count]) => ({ code, count }))
    .sort((a, b) => b.count - a.count);
}
