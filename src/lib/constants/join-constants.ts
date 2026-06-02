import type { FacilityType } from "@/types/clinic";
import type { JoinCategory } from "@/types/join";

// 夥伴類型選項（民眾端分流：診所 / 醫美 / 美業）
// facilityType 對齊後端 MedicalFacility.facility_type，方便日後落地建檔
export interface JoinCategoryOption {
  value: JoinCategory;
  label: string;
  description: string;
  facilityType: FacilityType;
  /** lucide-react icon 名稱（在元件端 map 成實際 icon） */
  icon: "stethoscope" | "sparkles" | "flower" | "store";
}

export const JOIN_CATEGORIES: JoinCategoryOption[] = [
  {
    value: "clinic",
    label: "診所",
    description: "健保 / 自費門診，依科別分流",
    facilityType: "healthcare",
    icon: "stethoscope",
  },
  {
    value: "aesthetic",
    label: "醫美診所",
    description: "醫學美容、微整、雷射、電波",
    facilityType: "aesthetic",
    icon: "sparkles",
  },
  {
    value: "beauty",
    label: "美業店家",
    description: "美容、美甲、美睫、紋繡、SPA",
    facilityType: "aesthetic",
    icon: "flower",
  },
  {
    value: "other",
    label: "其他",
    description: "其他健康 / 美容相關服務",
    facilityType: "healthcare",
    icon: "store",
  },
];

export const JOIN_CATEGORY_LABELS: Record<JoinCategory, string> = {
  clinic: "診所",
  aesthetic: "醫美診所",
  beauty: "美業店家",
  other: "其他",
};

// 「主要服務項目」欄位的 placeholder（診所走科別/付費，不在此）
export const SERVICE_PLACEHOLDERS: Partial<Record<JoinCategory, string>> = {
  aesthetic: "例：雷射、微整、電波拉皮、皮秒",
  beauty: "例：臉部護膚、美甲、美睫、紋繡、SPA",
  other: "請簡述您提供的服務類型",
};

// 團隊規模選項
export const TEAM_SIZE_OPTIONS = [
  { value: "1-5", label: "1–5 人" },
  { value: "6-15", label: "6–15 人" },
  { value: "16-50", label: "16–50 人" },
  { value: "50+", label: "50 人以上" },
] as const;
