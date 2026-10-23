import type { ApiService, ApiStaff, MedicalFacility } from '../types/clinic.ts';
import { adminClinicsApi } from '../api/admin/clinics.ts';
export const PANEL_LABELS: Record<string, string> = { today: '今日工作台', subscription: '我的訂閱', appointments: '預約管理', queue: '叫號與報到', patients: '客戶管理', schedule: '排班管理', analytics: '營運分析', stats: '看診統計', info: '院所設定', personnel: '人員設定', services: '服務項目', announcements: '公告' };
export const SETTINGS_PANELS = ['info', 'personnel', 'services', 'announcements'];
export function clinicHref(id: string, tab: string, params: Record<string, string> = {}): string {
  return `/admin/clinics/${encodeURIComponent(id)}?${new URLSearchParams({ tab, ...params })}`;
}
export interface BookingCatalog {
  facility: MedicalFacility;
  staff: ApiStaff[];
  services: ApiService[];
  assignments: Record<string, string[]>;
}
export async function loadBookingCatalog(facilityId: string): Promise<BookingCatalog> {
  const [facility, staff, services] = await Promise.all([adminClinicsApi.get(facilityId), adminClinicsApi.staff.list(facilityId), adminClinicsApi.services.list(facilityId)]);
  const bookable = staff.filter(s => s.is_active && s.is_bookable && ['doctor', 'beautician', 'therapist'].includes(s.role));
  const pairs = await Promise.all(bookable.map(async s => [s.id, (await adminClinicsApi.staffServices.list(facilityId, s.id)).map(x => x.service_id)] as const));
  return { facility, staff: bookable, services: services.filter(s => s.is_active), assignments: Object.fromEntries(pairs) };
}
export function matchingStaff(catalog: BookingCatalog, serviceId: string): ApiStaff[] {
  // 舊院所尚未設定服務對應時保留原本可預約人員；已有設定時依服務篩選。
  if (!serviceId || !Object.values(catalog.assignments).some(ids => ids.length)) return catalog.staff;
  return catalog.staff.filter(s => catalog.assignments[s.id]?.includes(serviceId));
}
