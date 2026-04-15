// 醫療分級
export type HospitalLevel =
  | "medical_center" // 醫學中心
  | "regional_hospital" // 區域醫院
  | "district_hospital" // 地區醫院
  | "clinic"; // 診所

// 服務類型（民眾分流用）
// healthcare: 健保診所（一般看診）
// self_pay:   自費診所（體檢、預防醫療、不收健保的專科）
// aesthetic:  醫美診所（微整、雷射、美容療程）
export type FacilityType = "healthcare" | "self_pay" | "aesthetic";

// 人員角色
export type MemberRole =
  | "doctor" // 醫師
  | "nurse" // 護理師
  | "receptionist" // 櫃檯
  | "admin" // 行政
  | "beautician" // 美容師
  | "therapist"; // 治療師

// 醫學科別
export type MedicalDepartment =
  | "internal_medicine" // 內科
  | "surgery" // 外科
  | "pediatrics" // 小兒科
  | "obstetrics_gynecology" // 婦產科
  | "orthopedics" // 骨科
  | "ophthalmology" // 眼科
  | "otolaryngology" // 耳鼻喉科
  | "dermatology" // 皮膚科
  | "urology" // 泌尿科
  | "neurology" // 神經科
  | "cardiology" // 心臟科
  | "gastroenterology" // 腸胃科
  | "nephrology" // 腎臟科
  | "rehabilitation" // 復健科
  | "psychiatry" // 精神科
  | "family_medicine" // 家醫科
  | "dentistry" // 牙科
  | "chinese_medicine"; // 中醫科

// 醫生
/** @deprecated 改用 Member */
export interface Doctor {
  id: string;
  name: string;
  title: string; // 職稱：主治醫師、主任醫師等
  department: MedicalDepartment;
  specialties: string[]; // 專長
  education: string; // 學歷
  experience: string; // 經歷
  avatar?: string;
}

// 職員角色
/** @deprecated 改用 MemberRole */
export type StaffRole = "nurse" | "receptionist" | "admin" | "assistant";

// 職員
/** @deprecated 改用 Member */
export interface Staff {
  id: string;
  name: string;
  role: StaffRole;
  title: string;
  avatar?: string;
}

// 美容師
/** @deprecated 改用 Member */
export interface Beautician {
  id: string;
  name: string;
  title: string; // 職稱：資深美容師、美容顧問等
  specialties: string[]; // 專長項目
  certifications: string[]; // 證照
  experience_years: number;
  avatar?: string;
}

// 人員（統一管理醫師、職員、美容師）
export interface Member {
  id: string;
  name: string;
  role: MemberRole;
  title?: string; // 職稱
  avatar?: string;
  phone?: string;
  email?: string;
  // 醫師專用欄位
  department?: MedicalDepartment;
  specialties?: string[]; // 專長
  education?: string; // 學歷
  experience?: string; // 經歷
  license_number?: string; // 執照號碼
  // 美容師專用欄位
  certifications?: string[]; // 證照
  experience_years?: number; // 年資
}

// 服務項目
export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration_minutes: number;
  category: string;
}

// 休息時段
export interface BreakTime {
  start: string; // HH:MM
  end: string;   // HH:MM
}

// 營業時間
export interface BusinessHours {
  day: string;
  open: string;
  close: string;
  is_closed: boolean;
  breaks?: BreakTime[];
}

// 醫療院所
export interface Clinic {
  id: string;
  clinic_name: string;
  hospital_level: HospitalLevel;
  departments: MedicalDepartment[];
  phone: string | null;
  address: string | null;
  city?: string; // 由 address 解析出的縣市，用於篩選
  facility_type?: FacilityType; // 服務類型（看診 / 自費 / 醫美）
  email?: string;
  website?: string;
  description?: string;
  rating?: number;
  review_count?: number;
  members?: Member[]; // 統一的人員列表
  /** @deprecated 改用 members 篩選 role === "doctor" */
  doctors?: Doctor[];
  /** @deprecated 改用 members */
  staff?: Staff[];
  /** @deprecated 改用 members 篩選 role === "beautician" */
  beauticians?: Beautician[];
  services?: Service[];
  business_hours?: BusinessHours[];
  images?: string[];
}

// 篩選條件
export interface ClinicFilters {
  search: string;
  hospitalLevel: HospitalLevel | "all";
  department: MedicalDepartment | "all";
  city: string | "all";
  facilityType: FacilityType | "all";
}

// ========== 後端 API 型別 (MedicalFacility) ==========

// 後端醫療科別（與前端略有不同）
export type ApiMedicalDepartment =
  | "general_practice" // 一般科
  | "internal_medicine" // 內科
  | "surgery" // 外科
  | "pediatrics" // 小兒科
  | "obstetrics_gynecology" // 婦產科
  | "orthopedics" // 骨科
  | "ophthalmology" // 眼科
  | "ent" // 耳鼻喉科
  | "dermatology" // 皮膚科
  | "psychiatry" // 精神科
  | "dentistry" // 牙科
  | "chinese_medicine" // 中醫
  | "rehabilitation" // 復健科
  | "family_medicine" // 家醫科
  | "urology" // 泌尿科
  | "cardiology" // 心臟科
  | "neurology" // 神經科
  | "other"; // 其他

// 付費類型
export type PaymentType = "nhi" | "self_pay" | "both";

// 訂閱方案
export type SubscriptionPlan = "trial" | "basic" | "standard" | "premium";

// 訂閱狀態
export type SubscriptionStatus = "trial" | "active" | "suspended" | "cancelled";

// 醫療單位（後端回傳格式）
export interface MedicalFacility {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  medical_department: ApiMedicalDepartment;
  payment_type: PaymentType;
  business_hours: Record<string, { open: string; close: string; breaks?: BreakTime[] }> | null;
  slot_duration: number; // 預約時段間隔（分鐘）
  is_active: boolean;
  // 訂閱資訊
  subscription_plan: SubscriptionPlan;
  subscription_status: SubscriptionStatus;
  subscription_started_at: string | null;
  subscription_expires_at: string | null;
  subscription_notes: string | null;
  created_at: string;
  updated_at: string | null;
}

// 更新訂閱資訊（superadmin only）
export interface FacilitySubscriptionUpdate {
  subscription_plan?: SubscriptionPlan;
  subscription_status?: SubscriptionStatus;
  subscription_started_at?: string | null;
  subscription_expires_at?: string | null;
  subscription_notes?: string | null;
}

// 新增醫療單位
export interface MedicalFacilityCreate {
  name: string;
  phone?: string;
  address?: string;
  medical_department: ApiMedicalDepartment;
  payment_type: PaymentType;
  business_hours?: Record<string, { open: string; close: string; breaks?: BreakTime[] }>;
  slot_duration?: number; // 預約時段間隔（分鐘）
}

// 更新醫療單位
export interface MedicalFacilityUpdate {
  name?: string;
  phone?: string;
  address?: string;
  medical_department?: ApiMedicalDepartment;
  payment_type?: PaymentType;
  business_hours?: Record<string, { open: string; close: string; breaks?: BreakTime[] }>;
  slot_duration?: number; // 預約時段間隔（分鐘）
  is_active?: boolean;
}

// ========== 職員 API 型別 ==========

// 職員角色（後端）
export type ApiStaffRole = "doctor" | "nurse" | "receptionist" | "admin" | "beautician" | "therapist";

export interface ApiStaff {
  id: string;
  facility_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  role: ApiStaffRole;
  is_active: boolean;
  is_public_visible: boolean;
  avatar_url: string | null;
  last_login: string | null;
  created_at: string;
  updated_at: string | null;

  // 醫師專屬欄位（role === "doctor"）
  department?: string;
  license_number?: string;
  license_type?: string;
  nhi_provider_id?: string;
  experience?: string[];
  education?: string[];
  main_specialties?: string[];

  // 美容師/治療師專屬欄位
  certifications?: string[];
  experience_years?: number;
}

export interface ApiStaffCreate {
  name: string;
  phone?: string;
  email?: string;
  role: ApiStaffRole;
  is_public_visible?: boolean;

  // 醫師專屬欄位
  department?: string;
  license_number?: string;
  license_type?: string;
  nhi_provider_id?: string;
  experience?: string[];
  education?: string[];
  main_specialties?: string[];

  // 美容師/治療師專屬欄位
  certifications?: string[];
  experience_years?: number;
}

export interface ApiStaffUpdate {
  name?: string;
  phone?: string;
  email?: string;
  role?: ApiStaffRole;
  is_active?: boolean;
  is_public_visible?: boolean;

  // 醫師專屬欄位
  department?: string;
  license_number?: string;
  license_type?: string;
  nhi_provider_id?: string;
  experience?: string[];
  education?: string[];
  main_specialties?: string[];

  // 美容師/治療師專屬欄位
  certifications?: string[];
  experience_years?: number;
}

// ========== 服務項目 API 型別 ==========

export interface ApiService {
  id: string;
  facility_id: string;
  service_name: string;
  description: string | null;
  price: number;
  duration_minutes: number;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
}

export interface ApiServiceCreate {
  service_name: string;
  description?: string;
  price: number;
  duration_minutes?: number;
}

export interface ApiServiceUpdate {
  service_name?: string;
  description?: string;
  price?: number;
  duration_minutes?: number;
  is_active?: boolean;
}

// ========== 預約 API 型別 ==========

export type AppointmentStatus = "confirmed" | "completed" | "cancelled" | "no_show";

export interface ApiAppointment {
  id: string;
  facility_id: string;
  patient_name: string;
  patient_phone: string;
  patient_gender: "male" | "female" | "other";
  service_id: string | null;
  service_name: string | null;
  staff_id: string | null;
  staff_name: string | null;
  appointment_date: string;
  appointment_time: string;
  status: AppointmentStatus;
  notes: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface ApiAppointmentUpdate {
  status?: AppointmentStatus;
  notes?: string;
  appointment_date?: string;
  appointment_time?: string;
  staff_id?: string;
}

// ========== 人員服務關聯 API 型別 ==========

export interface ApiStaffService {
  service_id: string;
  service_name: string;
  description: string | null;
  price: number;
  duration_minutes: number;
}

export interface ApiStaffServiceCreate {
  service_id: string;
}

// ========== 人員休假 API 型別 ==========

export interface ApiStaffLeave {
  id: string;
  staff_id: string;
  staff_name: string;
  date: string;  // 單日日期 (YYYY-MM-DD)
  note: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface ApiStaffLeaveCreate {
  date: string;  // 單日日期 (YYYY-MM-DD)
  note?: string;
}

export interface ApiStaffLeaveUpdate {
  date?: string;
  note?: string;
}
