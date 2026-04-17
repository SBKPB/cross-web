export type TimeOfDay = "morning" | "afternoon" | "evening";
export type Gender = "M" | "F";
export type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed";

export interface TimeSlot {
  id: string;
  time: string; // "09:00"
  period: TimeOfDay;
  isAvailable: boolean;
}

export interface BookableDate {
  date: string; // "2026-02-10"
  dayOfWeek: string; // "一"
  dayNumber: number;
  isToday: boolean;
  isAvailable: boolean;
  slots: TimeSlot[];
}

export interface ClinicConfig {
  id: string;
  clinic_name: string;
  logo?: string;
  hero_banner?: string;
  primary_color: string;
  phone: string | null;
  address: string | null;
  google_maps_url?: string;
  line_return_url?: string;
  slot_duration?: number; // 時段間隔（分鐘）：15, 30, 或 60，預設 30
}

export interface DoctorOption {
  id: string | null; // null = 不指定
  name: string;
  title: string;
  avatar?: string;
  specialties?: string[];
}

export interface ServiceOption {
  id: string;
  name: string;
  description: string;
  price: number;
  duration_minutes: number;
  category: string;
}

export interface BookingSelection {
  service: ServiceOption | null;
  doctor: DoctorOption | null;
  date: string | null;
  timeSlot: TimeSlot | null;
}

export interface BookingFormData {
  name: string;
  gender: Gender | null;
  birthDate: string;
  phone: string;
  notes: string;
  privacyAccepted: boolean;
}

export interface BookingRequest {
  clinic_id: string;
  member_patient_id: string;
  service_id: string;
  doctor_id: string | null;
  appointment_date: string;
  appointment_time: string;
  notes?: string;
}

export interface BookingResponse {
  id: string;
  booking_number: string;
  status: BookingStatus;
  clinic: {
    name: string;
    address: string;
    phone: string;
  };
  service: {
    name: string;
    duration_minutes: number;
  };
  doctor: {
    name: string;
    title: string;
  } | null;
  appointment_datetime: string;
  patient_name: string;
  patient_phone?: string;
}
