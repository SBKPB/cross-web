import type { Clinic } from "./types/clinic.ts";

// 已確認的示範院所僅供體驗；不依名稱猜測，以免隱藏真實合作店家。
// 舊版可用 NEXT_PUBLIC_DEMO_CLINIC_ID 覆寫，但各環境皆未設定；瀏覽器端沒有 process.env，
// 且此檔需可由 node --test 直接載入（不能用 $env），故直接寫死。
export const DEMO_CLINIC_ID = "42399a23-1119-407e-91ed-e2df5bdbb218";

export function isDemoClinic(id: string): boolean {
  return id === DEMO_CLINIC_ID;
}

function normalize(text: string): string {
  return text.normalize("NFKC").toLocaleLowerCase("zh-TW").replaceAll("台", "臺");
}

/** 每個關鍵字都須命中公開資料；不把症狀推論成診斷或醫療建議。 */
export function matchesClinicSearch(
  clinic: Clinic,
  query: string,
  categoryLabels: Record<string, string>,
): boolean {
  const terms = normalize(query).trim().split(/\s+/).filter(Boolean);
  const searchable = normalize([
    clinic.clinic_name,
    clinic.address,
    ...(clinic.service_names ?? []),
    ...(clinic.services ?? []).map((service) => service.name),
    ...clinic.departments.map((code) => categoryLabels[code] ?? code),
    ...(clinic.members ?? []).flatMap((member) => [member.name, ...(member.specialties ?? [])]),
  ].filter(Boolean).join(" "));
  return terms.every((term) => searchable.includes(term));
}
