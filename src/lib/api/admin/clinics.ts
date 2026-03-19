import { api } from "../client";
import type {
  MedicalFacility,
  MedicalFacilityCreate,
  MedicalFacilityUpdate,
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
};
