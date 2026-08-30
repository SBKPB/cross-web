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
    facilityType: "beauty",
    icon: "flower",
  },
  {
    value: "other",
    label: "其他",
    description: "其他健康 / 美容相關服務",
    facilityType: "other",
    icon: "store",
  },
];

// 選中時卡片換上的語意色。色相沿用民眾端診所卡的 FACILITY_TYPE_COLORS，
// 讓人在申請當下看到的顏色，就是日後上架後自己院所被標記的顏色。
// 另立一份而不直接沿用：badge 只需要一組淺底，卡片還要深色模式與實心 icon 底。
// 「其他」用 slate 但刻意拉到 700 實心——淺灰選中態會被誤讀成停用。
export const JOIN_CATEGORY_ACCENT: Record<
  JoinCategory,
  { card: string; solid: string }
> = {
  clinic: {
    card: "bg-sky-50 ring-sky-600 dark:bg-sky-950/40 dark:ring-sky-400",
    solid: "bg-sky-600 text-white dark:bg-sky-400 dark:text-sky-950",
  },
  aesthetic: {
    card: "bg-pink-50 ring-pink-600 dark:bg-pink-950/40 dark:ring-pink-400",
    solid: "bg-pink-600 text-white dark:bg-pink-400 dark:text-pink-950",
  },
  beauty: {
    card: "bg-rose-50 ring-rose-600 dark:bg-rose-950/40 dark:ring-rose-400",
    solid: "bg-rose-600 text-white dark:bg-rose-400 dark:text-rose-950",
  },
  other: {
    card: "bg-slate-100 ring-slate-600 dark:bg-slate-800/60 dark:ring-slate-400",
    solid: "bg-slate-700 text-white dark:bg-slate-300 dark:text-slate-900",
  },
};

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
