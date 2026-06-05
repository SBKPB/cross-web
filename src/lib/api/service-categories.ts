import { api } from "./client";
import type { FacilityType, PaymentType } from "@/types/clinic";

// ========== 服務分類字彙（單一來源，對應後端 GET /api/v1/service-categories） ==========
//
// 大類 tab、第二層子類別 chip、健保/自費付款選項、以及 code→中文 label，
// 全部以此 taxonomy 為準，取代過去散落的硬編碼常數。

export interface TaxonomyCategory {
  code: string;
  label: string;
}

export interface TaxonomyFacilityType {
  value: FacilityType;
  label: string;
  categories: TaxonomyCategory[];
}

export interface TaxonomyPaymentType {
  value: PaymentType;
  label: string;
}

export interface ServiceTaxonomy {
  facility_types: TaxonomyFacilityType[];
  payment_types: TaxonomyPaymentType[];
}

/**
 * 後端離線 / 首屏 SSR 失敗時的 fallback，內容須與後端
 * app/core/service_categories.py 對齊（看診沿用 18 科別 code）。
 */
export const FALLBACK_TAXONOMY: ServiceTaxonomy = {
  facility_types: [
    {
      value: "healthcare",
      label: "看診",
      categories: [
        { code: "general_practice", label: "一般科" },
        { code: "internal_medicine", label: "內科" },
        { code: "surgery", label: "外科" },
        { code: "pediatrics", label: "兒科" },
        { code: "obstetrics_gynecology", label: "婦產科" },
        { code: "orthopedics", label: "骨科" },
        { code: "ophthalmology", label: "眼科" },
        { code: "ent", label: "耳鼻喉科" },
        { code: "dermatology", label: "皮膚科" },
        { code: "psychiatry", label: "精神科" },
        { code: "dentistry", label: "牙科" },
        { code: "chinese_medicine", label: "中醫" },
        { code: "rehabilitation", label: "復健科" },
        { code: "family_medicine", label: "家醫科" },
        { code: "urology", label: "泌尿科" },
        { code: "cardiology", label: "心臟科" },
        { code: "neurology", label: "神經科" },
        { code: "other", label: "其他" },
      ],
    },
    {
      value: "aesthetic",
      label: "醫美",
      categories: [
        { code: "aes_injection", label: "微整注射" },
        { code: "aes_laser", label: "雷射光療" },
        { code: "aes_lifting", label: "電波・音波拉提" },
        { code: "aes_body", label: "體雕・抽脂" },
        { code: "aes_skin", label: "皮膚治療" },
        { code: "aes_hair", label: "植髮" },
      ],
    },
    {
      value: "beauty",
      label: "美容",
      categories: [
        { code: "bty_facial", label: "臉部護理・做臉" },
        { code: "bty_nail_lash", label: "美甲・美睫" },
        { code: "bty_pmu", label: "紋繡" },
        { code: "bty_spa", label: "SPA・舒壓按摩" },
        { code: "bty_hair_removal", label: "除毛" },
      ],
    },
    {
      value: "other",
      label: "其他",
      categories: [
        { code: "oth_manipulation", label: "傳統整復推拿" },
        { code: "oth_misc", label: "其他健康服務" },
      ],
    },
  ],
  payment_types: [
    { value: "nhi", label: "健保" },
    { value: "self_pay", label: "自費" },
    { value: "both", label: "健保+自費" },
  ],
};

export const serviceCategoriesApi = {
  /** 取得服務分類字彙；失敗時回 fallback，確保 UI 永遠有資料 */
  get: async (): Promise<ServiceTaxonomy> => {
    try {
      return await api.get<ServiceTaxonomy>("/api/v1/service-categories", {
        next: { revalidate: 3600 },
      });
    } catch {
      return FALLBACK_TAXONOMY;
    }
  },
};

/** 攤平所有大類的 categories 成 code→label 對照（含 oth_manipulation 等新 code） */
export function buildCategoryLabelMap(tax: ServiceTaxonomy): Record<string, string> {
  const map: Record<string, string> = {};
  for (const ft of tax.facility_types) {
    for (const c of ft.categories) map[c.code] = c.label;
  }
  return map;
}

/** 取某 code 的中文 label，查不到時回原 code（避免顯示空白） */
export function categoryLabel(tax: ServiceTaxonomy, code: string): string {
  for (const ft of tax.facility_types) {
    const hit = ft.categories.find((c) => c.code === code);
    if (hit) return hit.label;
  }
  return code;
}

/** 取某大類底下的子類別清單 */
export function categoriesFor(
  tax: ServiceTaxonomy,
  facilityType: FacilityType,
): TaxonomyCategory[] {
  return tax.facility_types.find((f) => f.value === facilityType)?.categories ?? [];
}

/** 取某大類的中文 label（看診/醫美/美容/其他） */
export function facilityTypeLabel(
  tax: ServiceTaxonomy,
  facilityType: FacilityType,
): string {
  return tax.facility_types.find((f) => f.value === facilityType)?.label ?? facilityType;
}

/** 取付款方式的中文 label（健保/自費/健保+自費） */
export function paymentLabel(tax: ServiceTaxonomy, value: PaymentType): string {
  return tax.payment_types.find((p) => p.value === value)?.label ?? value;
}
