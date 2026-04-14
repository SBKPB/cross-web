import { notFound } from "next/navigation";
import {
  ClinicDetailHeader,
  ClinicContactInfo,
  DepartmentBadges,
  DoctorTeamSection,
  ServicePreviewList,
  BusinessHoursSection,
  StickyBookingButton,
} from "@/components/clinic-detail";
import {
  deriveFacilityType,
  parseCityFromAddress,
} from "@/lib/constants/clinic-constants";
import type {
  BusinessHours,
  Clinic,
  FacilityType,
  Member,
  Service,
} from "@/types/clinic";

const API_BASE_URL = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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

// 角色名稱對照
const ROLE_NAMES: Record<string, string> = {
  doctor: "醫師",
  beautician: "美容師",
  therapist: "治療師",
};

interface ClinicDetailPageProps {
  params: Promise<{
    "clinic-id": string;
  }>;
}

// 將後端原始資料轉換為前端 Clinic 型別
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformClinicData(found: any): Clinic {
  const dayOrder = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
  const businessHours: BusinessHours[] | undefined = found.business_hours
    ? dayOrder
        .filter((day) => found.business_hours[day])
        .map((day) => ({
          day: DAY_NAMES[day] || day,
          open: found.business_hours[day].open,
          close: found.business_hours[day].close,
          is_closed: false,
        }))
    : undefined;

  const members: Member[] | undefined = found.members?.map((s: { id: string; name: string; role: string; main_specialties?: string[] }) => ({
    id: s.id,
    name: s.name,
    role: s.role as Member["role"],
    specialties: s.main_specialties,
    title: ROLE_NAMES[s.role] || s.role,
  }));

  const departments = found.departments?.length
    ? found.departments
    : found.medical_department
      ? [found.medical_department]
      : [];

  return {
    id: found.id,
    clinic_name: found.name,
    hospital_level: found.hospital_level || "clinic",
    departments,
    phone: found.phone,
    address: found.address,
    city: parseCityFromAddress(found.address),
    facility_type:
      (found.facility_type as FacilityType | undefined) ??
      deriveFacilityType(members),
    rating: found.rating ?? undefined,
    review_count: found.review_count ?? undefined,
    business_hours: businessHours,
    members,
  };
}

async function getServicesFromApi(clinicId: string): Promise<Service[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/booking/clinics/${clinicId}/services`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    const raw = await res.json();
    return raw.map((item: { id: string; service_name?: string; name?: string; description?: string | null; price: string | number; duration_minutes?: number; category?: string }) => ({
      id: item.id,
      name: item.service_name ?? item.name ?? "",
      description: item.description ?? "",
      price: Number(item.price) || 0,
      duration_minutes: item.duration_minutes ?? 30,
      category: item.category ?? "一般服務",
    }));
  } catch {
    return [];
  }
}

async function getClinicFromApi(clinicId: string): Promise<Clinic | null> {
  // 1. 優先嘗試 booking 單一院所端點
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/booking/clinics/${clinicId}`, {
      cache: "no-store",
    });
    if (res.ok) {
      const found = await res.json();
      return transformClinicData(found);
    }
  } catch {
    // 端點不存在或連線失敗，繼續嘗試下一個
  }

  // 2. Fallback: 從 booking 清單中查找
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/booking/clinics`, {
      cache: "no-store",
    });
    if (res.ok) {
      const clinics = await res.json();
      const found = clinics.find((c: { id: string }) => c.id === clinicId);
      if (found) return transformClinicData(found);
    }
  } catch {
    // 連線失敗
  }

  return null;
}

export default async function ClinicDetailPage({ params }: ClinicDetailPageProps) {
  const { "clinic-id": clinicId } = await params;

  // 平行取得院所資訊和服務項目
  const [clinic, services] = await Promise.all([
    getClinicFromApi(clinicId),
    getServicesFromApi(clinicId),
  ]);

  if (!clinic) {
    notFound();
  }

  // 合併服務項目到 clinic 資料
  if (services.length > 0) {
    clinic.services = services;
  }

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Hero header with gradient + clinic info card */}
      <ClinicDetailHeader clinic={clinic} />

      {/* Content sections */}
      <div className="mt-4 space-y-4">
        {/* Quick actions: call, navigate, hours */}
        <ClinicContactInfo clinic={clinic} />

        {/* Department badges */}
        <DepartmentBadges departments={clinic.departments} />

        {/* Team members */}
        {clinic.members && clinic.members.length > 0 && (
          <DoctorTeamSection members={clinic.members} />
        )}

        {/* Services */}
        {clinic.services && clinic.services.length > 0 && (
          <ServicePreviewList services={clinic.services} />
        )}

        {/* Business hours */}
        {clinic.business_hours && clinic.business_hours.length > 0 && (
          <BusinessHoursSection businessHours={clinic.business_hours} />
        )}
      </div>

      {/* Sticky bottom booking bar */}
      <StickyBookingButton clinicId={clinicId} />
    </div>
  );
}
