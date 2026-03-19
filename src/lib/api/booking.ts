import { api } from "./client";
import type {
  ClinicConfig,
  ServiceOption,
  DoctorOption,
  BookableDate,
  BookingRequest,
  BookingResponse,
} from "@/types/booking";

export const bookingApi = {
  getClinicConfig: async (clinicId: string): Promise<ClinicConfig | null> => {
    return api.get<ClinicConfig>(`/api/v1/booking/clinics/${clinicId}/config`);
  },

  getServices: async (clinicId: string): Promise<ServiceOption[]> => {
    const raw = await api.get<Record<string, unknown>[]>(
      `/api/v1/booking/clinics/${clinicId}/services`
    );
    return raw.map((item) => ({
      id: String(item.id),
      name: String(item.name ?? item.service_name ?? ""),
      description: String(item.description ?? ""),
      price: Number(item.price ?? 0),
      duration_minutes: Number(item.duration_minutes ?? 30),
      category: String(item.category ?? "一般服務"),
    }));
  },

  getDoctors: async (clinicId: string): Promise<DoctorOption[]> => {
    const raw = await api.get<Record<string, unknown>[]>(
      `/api/v1/booking/clinics/${clinicId}/doctors`
    );
    return raw.map((item) => ({
      id: (item.id as string) ?? null,
      name: String(item.name ?? ""),
      title: String(item.title ?? item.department ?? ""),
      avatar: (item.avatar as string) ?? undefined,
      specialties: (item.specialties ?? item.main_specialties ?? []) as string[],
    }));
  },

  getAvailableSlots: async (
    clinicId: string,
    serviceId: string,
    doctorId: string | null
  ): Promise<BookableDate[]> => {
    const params: Record<string, string> = { service_id: serviceId };
    if (doctorId) {
      params.doctor_id = doctorId;
    }
    return api.get<BookableDate[]>(`/api/v1/booking/clinics/${clinicId}/slots`, { params });
  },

  createBooking: async (request: BookingRequest): Promise<BookingResponse> => {
    return api.post<BookingResponse>(`/api/v1/booking/clinics/${request.clinic_id}/appointments`, request);
  },

  getBooking: async (bookingId: string): Promise<BookingResponse> => {
    return api.get<BookingResponse>(`/api/v1/booking/appointments/${bookingId}`);
  },

  sendOtp: async (phone: string): Promise<void> => {
    return api.post("/api/v1/otp/send", { phone });
  },

  verifyOtp: async (phone: string, code: string): Promise<boolean> => {
    const result = await api.post<{ verified: boolean }>("/api/v1/otp/verify", {
      phone,
      code,
    });
    return result.verified;
  },
};
