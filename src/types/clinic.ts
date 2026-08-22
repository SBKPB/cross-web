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

// 醫師/團隊成員完整資料（公開詳情用；對應後端 DoctorRead）
export interface ClinicDoctorDetail {
  id: string;
  name: string;
  role: string; // doctor / beautician / therapist
  department?: string; // 科別（中文，如「家醫科」）；後端無則省略
  avatar?: string;
  specialties: string[]; // 專長
  education: string[]; // 學歷
  experience: string[]; // 經歷
  license_type?: string; // 證照類別
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
  logo?: string | null; // 院所 logo public URL；無則前端用首字頭像 fallback
  email?: string;
  website?: string;
  description?: string;
  latitude?: number | null; // 緯度（本地 SEO geo）
  longitude?: number | null; // 經度（本地 SEO geo）
  rating?: number;
  review_count?: number;
  is_featured?: boolean; // 精選置頂（站內曝光）；true 時前端置頂並顯示「精選」badge
  members?: Member[]; // 統一的人員列表
  services?: Service[];
  business_hours?: BusinessHours[];
  images?: string[];
  online_booking_enabled?: boolean; // 是否開通線上預約（付費功能）；false 改顯示現場/電話預約
  phone_booking_enabled?: boolean; // 未開通線上預約時是否顯示電話預約（後台勾選，預設關閉）
  show_schedule?: boolean; // 是否顯示門診時刻表（診次週班表）；看診預設開、其他預設關
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

// ========== 診所公告 ==========

export interface Announcement {
  id: string;
  title: string | null;
  content: string;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
}

// 民眾端公告（只含 active 的公開欄位）
export interface AnnouncementPublic {
  id: string;
  title: string | null;
  content: string;
  created_at: string;
}

export interface AnnouncementCreate {
  title: string;
  content: string;
}

export interface AnnouncementUpdate {
  title?: string;
  content?: string;
  is_active?: boolean;
}

// 訂閱方案（三方案；對齊後端 app/models/base.py SubscriptionPlan）
export type SubscriptionPlan = "free" | "standard" | "pro";

// 訂閱狀態（trial 是狀態，非方案；試用期間 plan=pro + status=trial）
export type SubscriptionStatus = "trial" | "active" | "suspended" | "cancelled";

// 計費週期（只決定續約推幾個月與後台顯示，不影響功能權限）
export type BillingCycle = "monthly" | "annual";

// 醫療單位（後端回傳格式）
export interface MedicalFacility {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  description: string | null; // 診所自我介紹（SEO 差異化內容）
  latitude: number | null; // 緯度（本地 SEO geo）
  longitude: number | null; // 經度（本地 SEO geo）
  logo_url: string | null; // 院所 logo public URL（由上傳端點管理）
  service_categories: string[]; // 服務子類別 code（多選，須屬於該 facility_type）
  payment_type: PaymentType;
  facility_type: FacilityType;
  business_hours: Record<string, { open: string; close: string; breaks?: BreakTime[] }> | null;
  slot_duration: number; // 預約時段間隔（分鐘）
  is_active: boolean;
  phone_booking_enabled: boolean; // 未開通線上預約時是否顯示電話預約（後台勾選，預設關閉）
  show_schedule: boolean; // 是否啟用門診時刻表（診次週班表）；看診預設開、其他預設關
  // 訂閱資訊
  subscription_plan: SubscriptionPlan;
  subscription_status: SubscriptionStatus;
  subscription_started_at: string | null;
  subscription_expires_at: string | null;
  billing_cycle: BillingCycle;
  subscription_notes: string | null;
  trial_used_at: string | null; // 試用領取時間；null = 尚未用過（可一鍵試用）
  // 精選置頂（PRO 解鎖 + 後台逐間開關/到期）
  is_featured: boolean;
  featured_until: string | null;
  created_at: string;
  updated_at: string | null;
}

// 更新訂閱資訊（superadmin only）
export interface FacilitySubscriptionUpdate {
  subscription_plan?: SubscriptionPlan;
  subscription_status?: SubscriptionStatus;
  subscription_started_at?: string | null;
  subscription_expires_at?: string | null;
  // 有給且未同時指定 subscription_expires_at 時，後端會依週期自動推算到期日
  billing_cycle?: BillingCycle;
  subscription_notes?: string | null;
  // 精選置頂（需 PRO 解鎖；後端會驗證資格）
  is_featured?: boolean;
  featured_until?: string | null;
}

// 客戶分析（對齊後端 app/schemas/analytics.py AnalyticsRead）
export interface AnalyticsTrendPoint {
  period: string; // 分桶起始日 YYYY-MM-DD
  count: number;
}
export interface AnalyticsMethodCount {
  method: string; // BookingMethod value（phone / walk_in / online）
  count: number;
}
export interface AnalyticsHourCount {
  hour: number; // 0–23
  count: number;
}
export interface FacilityAnalytics {
  range_days: number;
  granularity: "day" | "week" | "month";
  start_date: string;
  end_date: string;
  total: number;
  confirmed: number;
  completed: number;
  cancelled: number;
  no_show: number;
  no_show_rate: number; // 0..1
  unique_patients: number;
  repeat_patient_rate: number; // 0..1
  trend: AnalyticsTrendPoint[];
  by_method: AnalyticsMethodCount[];
  by_hour: AnalyticsHourCount[];
}
/** 訪客人數（基本資訊，所有方案皆可看；不重複病患數） */
export interface VisitorCount {
  range_days: number;
  start_date: string;
  end_date: string;
  /** 區間內有預約的不重複病患數 */
  visitor_count: number;
  /** 診所頁的不重複造訪人數（IP 雜湊去重）；舊後端未回傳時視為 0 */
  page_view_count: number;
}
/** 單一醫師平均看診時長 + 平均等待時間（進階叫號 / PRO） */
export interface DoctorDuration {
  staff_id: string | null;
  staff_name: string | null; // null = 不指定醫師
  avg_consult_minutes: number | null; // 平均看診時長
  consult_count: number;
  avg_wait_minutes: number | null; // 平均等待時間（報到→看診）
  wait_count: number;
}
/** GET /medical-facilities/{id}/analytics/doctor-durations 回應 */
export interface DoctorDurations {
  range_days: number;
  doctors: DoctorDuration[];
}

// 新增醫療單位
export interface MedicalFacilityCreate {
  name: string;
  phone?: string;
  address?: string;
  description?: string; // 診所自我介紹（SEO 差異化內容）
  latitude?: number | null; // 緯度（本地 SEO geo）
  longitude?: number | null; // 經度（本地 SEO geo）
  service_categories: string[];
  payment_type: PaymentType;
  facility_type: FacilityType;
  business_hours?: Record<string, { open: string; close: string; breaks?: BreakTime[] }>;
  slot_duration?: number; // 預約時段間隔（分鐘）
  phone_booking_enabled?: boolean; // 未開通線上預約時是否顯示電話預約（預設關閉）
  show_schedule?: boolean; // 門診時刻表開關（建檔由後端依類型預設，看診開/其他關）
}

// 更新醫療單位
export interface MedicalFacilityUpdate {
  name?: string;
  phone?: string;
  address?: string;
  description?: string; // 診所自我介紹（SEO 差異化內容）
  latitude?: number | null; // 緯度（本地 SEO geo）
  longitude?: number | null; // 經度（本地 SEO geo）
  service_categories?: string[];
  payment_type?: PaymentType;
  facility_type?: FacilityType;
  business_hours?: Record<string, { open: string; close: string; breaks?: BreakTime[] }>;
  slot_duration?: number; // 預約時段間隔（分鐘）
  is_active?: boolean;
  phone_booking_enabled?: boolean; // 未開通線上預約時是否顯示電話預約（預設關閉）
  show_schedule?: boolean; // 是否啟用門診時刻表（診次週班表）
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
  is_bookable: boolean; // false = 暫停預約（移出班表與可約時段）
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
  is_bookable?: boolean;

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
  is_bookable?: boolean;

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

// 預約狀態機：confirmed → checked_in → in_progress → completed / no_show；
// cancelled 可自 confirmed 或 checked_in 取消。API 一律收/回小寫 value。
export type AppointmentStatus =
  | "confirmed"
  | "checked_in" // 已報到
  | "in_progress" // 看診中
  | "completed"
  | "cancelled"
  | "no_show";

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
  booking_method: "phone" | "walk_in" | "online";
  notes: string | null;
  queue_number: number | null; // 看診號（預約成立即取號；同診次隊列內遞增）
  check_in_time: string | null; // 報到時間（ISO8601；未報到為 null）
  created_at: string;
  updated_at: string | null;
}

// 後台代訂（櫃檯為現場/電話客人建立；身分證為識別碼）
export interface ApiAppointmentCreate {
  patient_name: string;
  patient_national_id: string;
  patient_phone?: string;
  patient_gender?: "M" | "F";
  service_id?: string;
  staff_id: string;
  appointment_date: string; // YYYY-MM-DD
  appointment_time: string; // HH:MM
  booking_method?: "phone" | "walk_in";
  notes?: string;
}

export interface ApiAppointmentUpdate {
  status?: AppointmentStatus;
  notes?: string;
  appointment_date?: string;
  appointment_time?: string;
  staff_id?: string;
}

// ========== 叫號/報到 API 型別 ==========

// 叫號台單筆預約（隊列內依 queue_number 排序，null 排最後再依 appointment_time）
export interface QueueAppointmentItem {
  id: string;
  queue_number: number | null;
  patient_name: string;
  appointment_time: string; // HH:MM
  status: AppointmentStatus;
  check_in_time: string | null; // ISO8601
  service_name: string | null;
}

// 診次隊列分組：(facility_id, appointment_date, staff_id)；staff_id null = 不指定醫師共用一條隊列
export interface QueueGroup {
  staff_id: string | null;
  staff_name: string | null;
  session_label: string | null;
  current_number: number | null; // 目前叫號（推導值，無 in_progress 且無 completed 為 null）
  waiting_count: number; // 等待人數（= checked_in 數）
  appointments: QueueAppointmentItem[];
}

// GET /medical-facilities/{id}/queue 回應
export interface QueueBoard {
  date: string; // YYYY-MM-DD
  groups: QueueGroup[];
}

// POST /medical-facilities/{id}/queue/call-next 請求
export interface QueueCallNextRequest {
  date: string; // YYYY-MM-DD
  staff_id: string | null;
}

// call-next 回應中被叫到者的摘要（對齊後端 CalledAppointmentRead，僅五欄，
// 不含 check_in_time / service_name —— 後端不回傳，勿在此型別上讀取）
export interface QueueCalledSummary {
  id: string;
  queue_number: number | null;
  patient_name: string;
  appointment_time: string; // HH:MM
  status: AppointmentStatus;
}

// POST /medical-facilities/{id}/queue/call-next 回應（called = 被叫那筆的摘要；無可叫時為 null）
export interface QueueCallNextResult {
  called: QueueCalledSummary | null;
  current_number: number | null;
}

// ========== 現場叫號公開看板（進階叫號 / PRO；/display 全螢幕，免登入） ==========

// 看板單筆（脫敏：僅號碼 + 遮罩姓名 + 狀態，絕不含全名）
export interface DisplayAppointment {
  queue_number: number | null;
  masked_name: string; // 如「王＊明」
  status: AppointmentStatus;
}
export interface DisplayGroup {
  staff_name: string | null;
  current_number: number | null;
  waiting_count: number;
  estimated_wait_minutes: number | null; // 新報到約略等候
  appointments: DisplayAppointment[]; // 僅 checked_in / in_progress
}
// GET /api/v1/booking/clinics/{facilityId}/queue-board（公開、免登入）
export interface DisplayBoard {
  enabled: boolean; // false = 院所未開通進階叫號（需升級 PRO）
  facility_name: string | null;
  date: string; // YYYY-MM-DD
  groups: DisplayGroup[];
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

// ========== 批次排班（智慧排班） ==========

export interface ApiScheduleBatchItem {
  staff_id: string;
  date: string; // YYYY-MM-DD
  start_time: string; // "09:00"
  end_time: string; // "12:00"
  session_type?: ScheduleSession;
  max_appointments?: number;
}

export interface ApiScheduleBatchCreate {
  items: ApiScheduleBatchItem[];
  skip_leaves?: boolean;
}

export interface ApiScheduleBatchResult {
  created: ApiSchedule[];
  created_count: number;
  skipped_existing: number;
  skipped_leave: number;
  skipped_invalid: number;
}
