import type {
  HospitalLevel,
  MedicalDepartment,
  ApiMedicalDepartment,
  PaymentType,
  MemberRole,
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
