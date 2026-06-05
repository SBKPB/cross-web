import { api } from "../client";
import type {
  MedicalFacility,
  MedicalFacilityCreate,
  MedicalFacilityUpdate,
  FacilitySubscriptionUpdate,
  ApiStaff,
  ApiStaffCreate,
  ApiStaffUpdate,
  ApiService,
  ApiServiceCreate,
  ApiServiceUpdate,
  ApiAppointment,
  ApiAppointmentUpdate,
  ApiStaffService,
  ApiStaffServiceCreate,
  ApiStaffLeave,
  ApiStaffLeaveCreate,
  ApiStaffLeaveUpdate,
  ApiSchedule,
  ApiScheduleCreate,
  ApiScheduleUpdate,
  Announcement,
  AnnouncementCreate,
  AnnouncementUpdate,
  FacilityAnalytics,
} from "@/types/clinic";

const BASE_PATH = "/api/v1/medical-facilities";

export const adminClinicsApi = {
  // ========== 醫療單位 ==========

  list: () => api.get<MedicalFacility[]>(`${BASE_PATH}/`),

  get: (id: string) => api.get<MedicalFacility>(`${BASE_PATH}/${id}`),

  create: (data: MedicalFacilityCreate) =>
    api.post<MedicalFacility>(`${BASE_PATH}/`, data),

  update: (id: string, data: MedicalFacilityUpdate) =>
    api.patch<MedicalFacility>(`${BASE_PATH}/${id}`, data),

  delete: (id: string) => api.delete<void>(`${BASE_PATH}/${id}`),

  // ========== 院所 Logo ==========

  uploadLogo: (id: string, file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return api.post<MedicalFacility>(`${BASE_PATH}/${id}/logo`, fd);
  },

  deleteLogo: (id: string) =>
    api.delete<MedicalFacility>(`${BASE_PATH}/${id}/logo`),

  // ========== 公告 ==========

  announcements: {
    list: (facilityId: string) =>
      api.get<Announcement[]>(`${BASE_PATH}/${facilityId}/announcements`),
    create: (facilityId: string, data: AnnouncementCreate) =>
      api.post<Announcement>(`${BASE_PATH}/${facilityId}/announcements`, data),
    update: (facilityId: string, id: string, data: AnnouncementUpdate) =>
      api.patch<Announcement>(
        `${BASE_PATH}/${facilityId}/announcements/${id}`,
        data,
      ),
    delete: (facilityId: string, id: string) =>
      api.delete<void>(`${BASE_PATH}/${facilityId}/announcements/${id}`),
  },

  // ========== 訂閱（superadmin only） ==========

  updateSubscription: (id: string, data: FacilitySubscriptionUpdate) =>
    api.patch<MedicalFacility>(`${BASE_PATH}/${id}/subscription`, data),

  // 一鍵試用 90 天（facility_admin 自助；限每院所一次，已用過回 409）
  startTrial: (id: string) =>
    api.post<MedicalFacility>(`${BASE_PATH}/${id}/start-trial`),

  // ========== 客戶分析（付費功能：pro / 試用） ==========

  analytics: (
    id: string,
    params?: { range?: number; granularity?: "day" | "week" | "month" },
  ) => {
    const sp = new URLSearchParams();
    if (params?.range) sp.append("range", String(params.range));
    if (params?.granularity) sp.append("granularity", params.granularity);
    const q = sp.toString();
    return api.get<FacilityAnalytics>(
      `${BASE_PATH}/${id}/analytics${q ? `?${q}` : ""}`,
    );
  },

  // ========== 單位設定 ==========

  settings: {
    get: (facilityId: string) =>
      api.get<{ business_hours: Record<string, unknown> | null; slot_duration: number }>(
        `${BASE_PATH}/${facilityId}/settings`
      ),

    update: (facilityId: string, data: { business_hours?: unknown; slot_duration?: number }) =>
      api.patch<{ business_hours: Record<string, unknown> | null; slot_duration: number }>(
        `${BASE_PATH}/${facilityId}/settings`,
        data
      ),
  },

  // ========== 職員（包含醫師、美容師、治療師等） ==========

  staff: {
    list: (facilityId: string) =>
      api.get<ApiStaff[]>(`${BASE_PATH}/${facilityId}/staff`),

    get: (facilityId: string, staffId: string) =>
      api.get<ApiStaff>(`${BASE_PATH}/${facilityId}/staff/${staffId}`),

    create: (facilityId: string, data: ApiStaffCreate) =>
      api.post<ApiStaff>(`${BASE_PATH}/${facilityId}/staff`, data),

    update: (facilityId: string, staffId: string, data: ApiStaffUpdate) =>
      api.patch<ApiStaff>(
        `${BASE_PATH}/${facilityId}/staff/${staffId}`,
        data
      ),

    delete: (facilityId: string, staffId: string) =>
      api.delete<void>(`${BASE_PATH}/${facilityId}/staff/${staffId}`),

    uploadAvatar: (facilityId: string, staffId: string, file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      return api.post<ApiStaff>(
        `${BASE_PATH}/${facilityId}/staff/${staffId}/avatar`,
        formData,
      );
    },
  },

  // ========== 服務項目 ==========

  services: {
    list: (facilityId: string) =>
      api.get<ApiService[]>(`${BASE_PATH}/${facilityId}/services`),

    get: (facilityId: string, serviceId: string) =>
      api.get<ApiService>(`${BASE_PATH}/${facilityId}/services/${serviceId}`),

    create: (facilityId: string, data: ApiServiceCreate) =>
      api.post<ApiService>(`${BASE_PATH}/${facilityId}/services`, data),

    update: (facilityId: string, serviceId: string, data: ApiServiceUpdate) =>
      api.patch<ApiService>(
        `${BASE_PATH}/${facilityId}/services/${serviceId}`,
        data
      ),

    delete: (facilityId: string, serviceId: string) =>
      api.delete<void>(`${BASE_PATH}/${facilityId}/services/${serviceId}`),
  },

  // ========== 預約 ==========

  appointments: {
    list: (facilityId: string, params?: { date?: string; start_date?: string; end_date?: string; status?: string }) => {
      const searchParams = new URLSearchParams();
      if (params?.date) searchParams.append("date", params.date);
      if (params?.start_date) searchParams.append("start_date", params.start_date);
      if (params?.end_date) searchParams.append("end_date", params.end_date);
      if (params?.status) searchParams.append("status", params.status);
      const query = searchParams.toString();
      return api.get<ApiAppointment[]>(
        `${BASE_PATH}/${facilityId}/appointments${query ? `?${query}` : ""}`
      );
    },

    get: (facilityId: string, appointmentId: string) =>
      api.get<ApiAppointment>(
        `${BASE_PATH}/${facilityId}/appointments/${appointmentId}`
      ),

    update: (
      facilityId: string,
      appointmentId: string,
      data: ApiAppointmentUpdate
    ) =>
      api.patch<ApiAppointment>(
        `${BASE_PATH}/${facilityId}/appointments/${appointmentId}`,
        data
      ),

    cancel: (facilityId: string, appointmentId: string) =>
      api.patch<ApiAppointment>(
        `${BASE_PATH}/${facilityId}/appointments/${appointmentId}`,
        { status: "cancelled" }
      ),
  },

  // ========== 人員服務關聯 ==========

  staffServices: {
    list: (facilityId: string, staffId: string) =>
      api.get<ApiStaffService[]>(
        `${BASE_PATH}/${facilityId}/staff/${staffId}/services`
      ),

    add: (facilityId: string, staffId: string, data: ApiStaffServiceCreate) =>
      api.post<ApiStaffService>(
        `${BASE_PATH}/${facilityId}/staff/${staffId}/services`,
        data
      ),

    remove: (facilityId: string, staffId: string, serviceId: string) =>
      api.delete<void>(
        `${BASE_PATH}/${facilityId}/staff/${staffId}/services/${serviceId}`
      ),
  },

  // ========== 人員休假 ==========

  staffLeaves: {
    list: (
      facilityId: string,
      staffId: string,
      params?: { start_date?: string; end_date?: string }
    ) => {
      const searchParams = new URLSearchParams();
      if (params?.start_date) searchParams.append("start_date", params.start_date);
      if (params?.end_date) searchParams.append("end_date", params.end_date);
      const query = searchParams.toString();
      return api.get<ApiStaffLeave[]>(
        `${BASE_PATH}/${facilityId}/staff/${staffId}/leaves${query ? `?${query}` : ""}`
      );
    },

    /** 一次撈整個院所所有人員的休假（取代 per-staff 逐一打的 N+1） */
    listAll: (
      facilityId: string,
      params?: { start_date?: string; end_date?: string }
    ) => {
      const searchParams = new URLSearchParams();
      if (params?.start_date) searchParams.append("start_date", params.start_date);
      if (params?.end_date) searchParams.append("end_date", params.end_date);
      const query = searchParams.toString();
      return api.get<ApiStaffLeave[]>(
        `${BASE_PATH}/${facilityId}/staff-leaves${query ? `?${query}` : ""}`
      );
    },

    create: (facilityId: string, staffId: string, data: ApiStaffLeaveCreate) =>
      api.post<ApiStaffLeave>(
        `${BASE_PATH}/${facilityId}/staff/${staffId}/leaves`,
        data
      ),

    update: (
      facilityId: string,
      staffId: string,
      leaveId: string,
      data: ApiStaffLeaveUpdate
    ) =>
      api.patch<ApiStaffLeave>(
        `${BASE_PATH}/${facilityId}/staff/${staffId}/leaves/${leaveId}`,
        data
      ),

    delete: (facilityId: string, staffId: string, leaveId: string) =>
      api.delete<void>(
        `${BASE_PATH}/${facilityId}/staff/${staffId}/leaves/${leaveId}`
      ),
  },

  // ========== 門診排班 ==========

  schedules: {
    /** 一次撈整個院所所有人員的排班 */
    listAll: (
      facilityId: string,
      params?: { start_date?: string; end_date?: string }
    ) => {
      const searchParams = new URLSearchParams();
      if (params?.start_date) searchParams.append("start_date", params.start_date);
      if (params?.end_date) searchParams.append("end_date", params.end_date);
      const query = searchParams.toString();
      return api.get<ApiSchedule[]>(
        `${BASE_PATH}/${facilityId}/schedules${query ? `?${query}` : ""}`
      );
    },

    create: (facilityId: string, staffId: string, data: ApiScheduleCreate) =>
      api.post<ApiSchedule>(
        `${BASE_PATH}/${facilityId}/staff/${staffId}/schedules`,
        data
      ),

    update: (
      facilityId: string,
      staffId: string,
      scheduleId: string,
      data: ApiScheduleUpdate
    ) =>
      api.patch<ApiSchedule>(
        `${BASE_PATH}/${facilityId}/staff/${staffId}/schedules/${scheduleId}`,
        data
      ),

    delete: (facilityId: string, staffId: string, scheduleId: string) =>
      api.delete<void>(
        `${BASE_PATH}/${facilityId}/staff/${staffId}/schedules/${scheduleId}`
      ),
  },
};
