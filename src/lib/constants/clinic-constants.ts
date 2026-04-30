import type {
  ApiMedicalDepartment,
  FacilityType,
  HospitalLevel,
  MedicalDepartment,
  Member,
  MemberRole,
  PaymentType,
} from "@/types/clinic";

// 醫療分級對照
export const HOSPITAL_LEVELS: Record<HospitalLevel, string> = {
  medical_center: "醫學中心",
  regional_hospital: "區域醫院",
  district_hospital: "地區醫院",
  clinic: "診所",
};

// 醫療分級選項（含全部）
export const HOSPITAL_LEVEL_OPTIONS = [
  { value: "all", label: "全部分級" },
  { value: "medical_center", label: "醫學中心" },
  { value: "regional_hospital", label: "區域醫院" },
  { value: "district_hospital", label: "地區醫院" },
  { value: "clinic", label: "診所" },
] as const;

// 醫療分級顏色
export const HOSPITAL_LEVEL_COLORS: Record<HospitalLevel, string> = {
  medical_center:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  regional_hospital:
    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  district_hospital:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  clinic: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
};

// 醫學科別對照
export const MEDICAL_DEPARTMENTS: Record<MedicalDepartment, string> = {
  internal_medicine: "內科",
  surgery: "外科",
  pediatrics: "小兒科",
  obstetrics_gynecology: "婦產科",
  orthopedics: "骨科",
  ophthalmology: "眼科",
  otolaryngology: "耳鼻喉科",
  dermatology: "皮膚科",
  urology: "泌尿科",
  neurology: "神經科",
  cardiology: "心臟科",
  gastroenterology: "腸胃科",
  nephrology: "腎臟科",
  rehabilitation: "復健科",
  psychiatry: "精神科",
  family_medicine: "家醫科",
  dentistry: "牙科",
  chinese_medicine: "中醫科",
};

// 醫學科別選項（含全部）
export const DEPARTMENT_OPTIONS = [
  { value: "all", label: "全部科別" },
  { value: "internal_medicine", label: "內科" },
  { value: "surgery", label: "外科" },
  { value: "pediatrics", label: "小兒科" },
  { value: "obstetrics_gynecology", label: "婦產科" },
  { value: "orthopedics", label: "骨科" },
  { value: "ophthalmology", label: "眼科" },
  { value: "otolaryngology", label: "耳鼻喉科" },
  { value: "dermatology", label: "皮膚科" },
  { value: "urology", label: "泌尿科" },
  { value: "neurology", label: "神經科" },
  { value: "cardiology", label: "心臟科" },
  { value: "gastroenterology", label: "腸胃科" },
  { value: "nephrology", label: "腎臟科" },
  { value: "rehabilitation", label: "復健科" },
  { value: "psychiatry", label: "精神科" },
  { value: "family_medicine", label: "家醫科" },
  { value: "dentistry", label: "牙科" },
  { value: "chinese_medicine", label: "中醫科" },
] as const;

// 科別顏色
export const DEPARTMENT_COLORS: Record<MedicalDepartment, string> = {
  internal_medicine:
    "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  surgery: "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300",
  pediatrics: "bg-pink-50 text-pink-700 dark:bg-pink-900/20 dark:text-pink-300",
  obstetrics_gynecology:
    "bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-300",
  orthopedics:
    "bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300",
  ophthalmology:
    "bg-cyan-50 text-cyan-700 dark:bg-cyan-900/20 dark:text-cyan-300",
  otolaryngology:
    "bg-teal-50 text-teal-700 dark:bg-teal-900/20 dark:text-teal-300",
  dermatology:
    "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300",
  urology:
    "bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300",
  neurology:
    "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300",
  cardiology:
    "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200",
  gastroenterology:
    "bg-lime-50 text-lime-700 dark:bg-lime-900/20 dark:text-lime-300",
  nephrology:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300",
  rehabilitation:
    "bg-sky-50 text-sky-700 dark:bg-sky-900/20 dark:text-sky-300",
  psychiatry:
    "bg-violet-50 text-violet-700 dark:bg-violet-900/20 dark:text-violet-300",
  family_medicine:
    "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300",
  dentistry: "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300",
  chinese_medicine:
    "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200",
};

// ========== 後端 API 對應常數 ==========

// API 醫療科別對照
export const API_MEDICAL_DEPARTMENTS: Record<ApiMedicalDepartment, string> = {
  general_practice: "一般科",
  internal_medicine: "內科",
  surgery: "外科",
  pediatrics: "小兒科",
  obstetrics_gynecology: "婦產科",
  orthopedics: "骨科",
  ophthalmology: "眼科",
  ent: "耳鼻喉科",
  dermatology: "皮膚科",
  psychiatry: "精神科",
  dentistry: "牙科",
  chinese_medicine: "中醫",
  rehabilitation: "復健科",
  family_medicine: "家醫科",
  urology: "泌尿科",
  cardiology: "心臟科",
  neurology: "神經科",
  other: "其他",
};

// API 醫療科別選項
export const API_DEPARTMENT_OPTIONS = [
  { value: "general_practice", label: "一般科" },
  { value: "internal_medicine", label: "內科" },
  { value: "surgery", label: "外科" },
  { value: "pediatrics", label: "小兒科" },
  { value: "obstetrics_gynecology", label: "婦產科" },
  { value: "orthopedics", label: "骨科" },
  { value: "ophthalmology", label: "眼科" },
  { value: "ent", label: "耳鼻喉科" },
  { value: "dermatology", label: "皮膚科" },
  { value: "psychiatry", label: "精神科" },
  { value: "dentistry", label: "牙科" },
  { value: "chinese_medicine", label: "中醫" },
  { value: "rehabilitation", label: "復健科" },
  { value: "family_medicine", label: "家醫科" },
  { value: "urology", label: "泌尿科" },
  { value: "cardiology", label: "心臟科" },
  { value: "neurology", label: "神經科" },
  { value: "other", label: "其他" },
] as const;

// 付費類型對照
export const PAYMENT_TYPES: Record<PaymentType, string> = {
  nhi: "健保",
  self_pay: "自費",
  both: "健保+自費",
};

// 付費類型選項
export const PAYMENT_TYPE_OPTIONS = [
  { value: "nhi", label: "健保" },
  { value: "self_pay", label: "自費" },
  { value: "both", label: "健保+自費" },
] as const;

// 人員角色對照
export const MEMBER_ROLES: Record<MemberRole, string> = {
  doctor: "醫師",
  nurse: "護理師",
  receptionist: "櫃檯",
  admin: "行政",
  beautician: "美容師",
  therapist: "治療師",
};

// 人員角色選項
export const MEMBER_ROLE_OPTIONS = [
  { value: "doctor", label: "醫師" },
  { value: "nurse", label: "護理師" },
  { value: "receptionist", label: "櫃檯" },
  { value: "admin", label: "行政" },
  { value: "beautician", label: "美容師" },
  { value: "therapist", label: "治療師" },
] as const;

/** @deprecated 改用 MEMBER_ROLES */
export const STAFF_ROLES = MEMBER_ROLES;

/** @deprecated 改用 MEMBER_ROLE_OPTIONS */
export const STAFF_ROLE_OPTIONS = MEMBER_ROLE_OPTIONS;

// ========== 縣市 ==========

// 台灣 22 縣市（順序依北到南、離島最後）
export const TAIWAN_CITIES = [
  "臺北市",
  "新北市",
  "基隆市",
  "桃園市",
  "新竹市",
  "新竹縣",
  "苗栗縣",
  "臺中市",
  "彰化縣",
  "南投縣",
  "雲林縣",
  "嘉義市",
  "嘉義縣",
  "臺南市",
  "高雄市",
  "屏東縣",
  "宜蘭縣",
  "花蓮縣",
  "臺東縣",
  "澎湖縣",
  "金門縣",
  "連江縣",
] as const;

// 城市選項（含「全部」）
export const CITY_OPTIONS = [
  { value: "all", label: "全部縣市" },
  ...TAIWAN_CITIES.map((city) => ({ value: city, label: city })),
];

/**
 * 從地址字串解析出縣市名稱
 * 支援「台」「臺」兩種寫法，一律正規化為「臺」
 * 範例：「807高雄市三民區長明街175號」 → 「高雄市」
 */
export function parseCityFromAddress(address: string | null | undefined): string | undefined {
  if (!address) return undefined;
  const normalized = address.replace(/台/g, "臺");
  for (const city of TAIWAN_CITIES) {
    if (normalized.includes(city)) return city;
  }
  return undefined;
}

// ========== 服務類型（FacilityType） ==========

export const FACILITY_TYPE_LABELS: Record<FacilityType, string> = {
  healthcare: "健保看診",
  self_pay: "自費門診",
  aesthetic: "美容諮詢",
};

// Hero tabs 短標籤
export const FACILITY_TYPE_SHORT_LABELS: Record<FacilityType, string> = {
  healthcare: "健保",
  self_pay: "自費",
  aesthetic: "美容",
};

// 服務類型顏色（用於 badge）
export const FACILITY_TYPE_COLORS: Record<FacilityType, string> = {
  healthcare: "bg-sky-100 text-sky-700",
  self_pay: "bg-amber-100 text-amber-700",
  aesthetic: "bg-pink-100 text-pink-700",
};

// 服務類型選項（含「全部」，前台篩選用）
export const FACILITY_TYPE_OPTIONS = [
  { value: "all", label: "全部類型" },
  { value: "healthcare", label: "健保看診" },
  { value: "self_pay", label: "自費門診" },
  { value: "aesthetic", label: "美容諮詢" },
] as const;

// 後台表單用（不含「全部」）
export const FACILITY_TYPE_FORM_OPTIONS: ReadonlyArray<{ value: FacilityType; label: string }> = [
  { value: "healthcare", label: "健保看診" },
  { value: "self_pay", label: "自費門診" },
  { value: "aesthetic", label: "美容諮詢" },
];

/**
 * 依成員組成推導服務類型
 * - 有美容師 / 治療師 → aesthetic
 * - 否則 → healthcare（自費暫無法從現有欄位判斷，等後端支援）
 */
export function deriveFacilityType(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _members: Member[] | undefined,
): FacilityType {
  // 後端已有 facility_type 欄位，此 fallback 僅在後端漏回時用，
  // 永遠回 healthcare 最安全（不依職業身分臆測，避免治療師被誤判為醫美）
  return "healthcare";
}

// ========== 熱門搜尋（Hero chips） ==========

// 依 tab 切換的熱門搜尋項目
// kind:
//   "dept" → 點擊後帶 dept 參數進搜尋頁
//   "query" → 點擊後帶 q 參數做關鍵字搜尋
export type PopularChip = {
  label: string;
  kind: "dept" | "query";
  value: string;
};

export const POPULAR_CHIPS_BY_TYPE: Record<FacilityType, PopularChip[]> = {
  healthcare: [
    { label: "家醫科", kind: "dept", value: "family_medicine" },
    { label: "牙科", kind: "dept", value: "dentistry" },
    { label: "皮膚科", kind: "dept", value: "dermatology" },
    { label: "耳鼻喉", kind: "dept", value: "otolaryngology" },
    { label: "小兒科", kind: "dept", value: "pediatrics" },
    { label: "復健科", kind: "dept", value: "rehabilitation" },
    { label: "眼科", kind: "dept", value: "ophthalmology" },
  ],
  aesthetic: [
    { label: "微整形", kind: "query", value: "微整" },
    { label: "雷射", kind: "query", value: "雷射" },
    { label: "電波", kind: "query", value: "電波" },
    { label: "肉毒", kind: "query", value: "肉毒" },
    { label: "玻尿酸", kind: "query", value: "玻尿酸" },
    { label: "痘痘肌", kind: "query", value: "痘痘" },
  ],
  self_pay: [
    { label: "健康檢查", kind: "query", value: "健檢" },
    { label: "疫苗接種", kind: "query", value: "疫苗" },
    { label: "自費門診", kind: "query", value: "自費" },
    { label: "中醫調理", kind: "dept", value: "chinese_medicine" },
    { label: "牙齒美白", kind: "query", value: "美白" },
  ],
};
