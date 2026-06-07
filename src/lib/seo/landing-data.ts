import { parseCityFromAddress } from "@/lib/constants/clinic-constants";
import type { FacilityType, PaymentType } from "@/types/clinic";

// 伺服器端直接打後端（與 sitemap.ts / clinic 頁一致）
const API_BASE_URL =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8000";

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

/** 取得所有公開診所（在地落地頁共用；每小時 revalidate） */
export async function getAllClinics(): Promise<LandingClinic[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/booking/clinics`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const raw = (await res.json()) as RawClinic[];
    return raw.map((c) => ({
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
  } catch {
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
