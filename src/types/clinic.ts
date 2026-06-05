import type { ScheduleSession } from "./schedule";

// 醫療分級
export type HospitalLevel =
  | "medical_center" // 醫學中心
  | "regional_hospital" // 區域醫院
  | "district_hospital" // 地區醫院
  | "clinic"; // 診所

// 服務型態（民眾分流用）— 純服務軸，不含付款軸
// 健保 vs 自費屬「付款方式」，由 PaymentType 表達，不放這裡。
// healthcare: 看診（一般醫療門診，含健保與自費，由 payment_type 區分）
// aesthetic:  醫美（微整、雷射、電波等醫學美容診所）
// beauty:     美容（美容、美甲、美睫、紋繡、SPA 等美業店家，非醫療）
// other:      其他（傳統整復推拿等民俗調理、其他健康相關服務）
export type FacilityType = "healthcare" | "aesthetic" | "beauty" | "other";

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
  // 服務子類別 code（service_category code，看診沿用 18 科別 code、其餘 aes_/bty_/oth_ 前綴）
  // 顯示時用 service-categories taxonomy 查 code→中文 label
  departments: string[];
  phone: string | null;
  address: string | null;
  city?: string; // 由 address 解析出的縣市，用於篩選
  facility_type?: FacilityType; // 服務型態（看診 / 醫美 / 美容 / 其他）
  payment_type?: PaymentType; // 付款方式（健保 / 自費 / 兩者）
  email?: string;
  website?: string;
  description?: string;
  rating?: number;
  review_count?: number;
  members?: Member[]; // 統一的人員列表
  services?: Service[];
  business_hours?: BusinessHours[];
  images?: string[];
}

// 篩選條件
export interface ClinicFilters {
  search: string;
  hospitalLevel: HospitalLevel | "all";
  // 第二層子類別篩選（service_category code，可多選；空陣列=不限）
  serviceCategories: string[];
  city: string | "all";
  facilityType: FacilityType | "all";
  // 付款方式篩選（看診大類下使用）：'all' | 健保 | 自費 | 兩者
  paymentType: PaymentType | "all";
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
  service_categories: string[]; // 服務子類別 code（多選，須屬於該 facility_type）
  payment_type: PaymentType;
  facility_type: FacilityType;
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
  service_categories: string[];
  payment_type: PaymentType;
  facility_type: FacilityType;
  business_hours?: Record<string, { open: string; close: string; breaks?: BreakTime[] }>;
  slot_duration?: number; // 預約時段間隔（分鐘）
}

// 更新醫療單位
export interface MedicalFacilityUpdate {
  name?: string;
  phone?: string;
  address?: string;
  service_categories?: string[];
  payment_type?: PaymentType;
  facility_type?: FacilityType;
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

// ========== 門診排班 API 型別 ==========

export interface ApiSchedule {
  id: string;
  staff_id: string;
  staff_name: string;
  date: string; // YYYY-MM-DD
  start_time: string; // "13:00:00"
  end_time: string; // "17:00:00"
  session_type: ScheduleSession; // morning / afternoon / evening
  max_appointments: number;
  is_available: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface ApiScheduleCreate {
  date: string; // YYYY-MM-DD
  start_time: string; // "13:00"
  end_time: string; // "17:00"
  session_type?: ScheduleSession;
  max_appointments?: number;
  is_available?: boolean;
  notes?: string;
}

export interface ApiScheduleUpdate {
  date?: string;
  start_time?: string;
  end_time?: string;
  session_type?: ScheduleSession;
  max_appointments?: number;
  is_available?: boolean;
  notes?: string;
}
