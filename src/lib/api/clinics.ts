import { api } from "./client";
import {
  deriveFacilityType,
  parseCityFromAddress,
} from "@/lib/constants/clinic-constants";
import type {
  BusinessHours,
  Clinic,
  FacilityType,
  Member,
  PaymentType,
} from "@/types/clinic";

// 後端人員資料格式
interface BackendStaff {
  id: string;
  name: string;
  role: string;
  main_specialties?: string[];
}

// 後端診所資料格式（對齊後端 ClinicListItem schema）
export interface BackendClinic {
  id: string;
  name: string;  // 後端返回 name，前端使用 clinic_name
  hospital_level?: string;
  facility_type?: FacilityType;
  payment_type?: PaymentType;
  logo?: string | null;
  // departments 攜帶 service_category code（看診沿用 18 科別 code，其餘 aes_/bty_/oth_ 前綴）
  departments?: string[];
  phone: string | null;
  address: string | null;
  description?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  rating?: number | null;
  review_count?: number | null;
  business_hours?: Record<string, { open: string; close: string }> | null;
  members?: BackendStaff[];
  is_featured?: boolean;
  online_booking_enabled?: boolean;
  phone_booking_enabled?: boolean;
  show_schedule?: boolean;
}

// 星期對照表
const DAY_NAMES: Record<string, string> = {
  monday: "週一",
  tuesday: "週二",
  wednesday: "週三",
  thursday: "週四",
  friday: "週五",
  saturday: "週六",
  sunday: "週日",
};

// 轉換營業時間格式（物件 -> 陣列）
function transformBusinessHours(
  hours: Record<string, { open: string; close: string }> | null | undefined
): BusinessHours[] | undefined {
  if (!hours) return undefined;

  const dayOrder = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

  return dayOrder
    .filter((day) => hours[day])
    .map((day) => ({
      day: DAY_NAMES[day] || day,
      open: hours[day].open,
      close: hours[day].close,
      is_closed: false,
    }));
}

// 角色名稱對照
const ROLE_NAMES: Record<string, string> = {
  doctor: "醫師",
  beautician: "美容師",
  therapist: "治療師",
};

// 轉換後端格式為前端格式（收藏 / 最近瀏覽等也共用此映射）
export function transformClinic(backendClinic: BackendClinic): Clinic {
  // departments 攜帶 service_category code（顯示時用 taxonomy 查 code→中文 label）
  const departments = backendClinic.departments ?? [];

  // 轉換人員資料
  const members = backendClinic.members?.map((staff) => ({
    id: staff.id,
    name: staff.name,
    role: staff.role as Member["role"],
    specialties: staff.main_specialties,
    title: ROLE_NAMES[staff.role] || staff.role,
  }));

  return {
    id: backendClinic.id,
    clinic_name: backendClinic.name,
    hospital_level: (backendClinic.hospital_level || "clinic") as Clinic["hospital_level"],
    departments,
    phone: backendClinic.phone,
    address: backendClinic.address,
    city: parseCityFromAddress(backendClinic.address),
    // 優先用後端回傳的 facility_type；舊資料 fallback 用成員推導
    facility_type: backendClinic.facility_type ?? deriveFacilityType(members),
    payment_type: backendClinic.payment_type,
    logo: backendClinic.logo ?? null,
    description: backendClinic.description ?? undefined,
    latitude: backendClinic.latitude ?? null,
    longitude: backendClinic.longitude ?? null,
    rating: backendClinic.rating ?? undefined,
    review_count: backendClinic.review_count ?? undefined,
    is_featured: backendClinic.is_featured ?? false,
    business_hours: transformBusinessHours(backendClinic.business_hours),
    members: members,
    online_booking_enabled: backendClinic.online_booking_enabled,
    phone_booking_enabled: backendClinic.phone_booking_enabled,
    show_schedule: backendClinic.show_schedule,
  };
}

export const clinicsApi = {
  getClinics: async (): Promise<Clinic[]> => {
    const backendClinics = await api.get<BackendClinic[]>(
      "/api/v1/booking/clinics",
      { next: { revalidate: 300 } },
    );
    return backendClinics.map(transformClinic);
  },

  getPopularClinics: async (limit = 6): Promise<Clinic[]> => {
    const backendClinics = await api.get<BackendClinic[]>(
      `/api/v1/booking/clinics/popular?limit=${limit}`,
      { next: { revalidate: 300 } },
    );
    return backendClinics.map(transformClinic);
  },
};
