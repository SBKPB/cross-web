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
} from "@/types/clinic";

// 後端人員資料格式
interface BackendStaff {
  id: string;
  name: string;
  role: string;
  main_specialties?: string[];
}

// 後端診所資料格式
interface BackendClinic {
  id: string;
  name: string;  // 後端返回 name，前端使用 clinic_name
  hospital_level?: string;
  facility_type?: FacilityType;
  medical_department?: string;
  departments?: string[];
  phone: string | null;
  address: string | null;
  rating?: number | null;
  review_count?: number | null;
  business_hours?: Record<string, { open: string; close: string }> | null;
  members?: BackendStaff[];
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

// 轉換後端格式為前端格式
function transformClinic(backendClinic: BackendClinic): Clinic {
  // 處理科別：優先使用 departments 陣列，否則使用 medical_department
  const departments = backendClinic.departments?.length
    ? backendClinic.departments
    : backendClinic.medical_department
      ? [backendClinic.medical_department]
      : [];

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
    departments: departments as Clinic["departments"],
    phone: backendClinic.phone,
    address: backendClinic.address,
    city: parseCityFromAddress(backendClinic.address),
    // 優先用後端回傳的 facility_type；舊資料 fallback 用成員推導
    facility_type: backendClinic.facility_type ?? deriveFacilityType(members),
    rating: backendClinic.rating ?? undefined,
    review_count: backendClinic.review_count ?? undefined,
    business_hours: transformBusinessHours(backendClinic.business_hours),
    members: members,
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
