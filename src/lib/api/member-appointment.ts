import { api } from "./client";
import type { AppointmentStatus } from "@/types/clinic";

// 會員跨院所預約紀錄（對齊後端 MemberAppointmentRead，欄位以後端為準）
export interface MemberAppointment {
  id: string;
  facility_name: string;
  staff_name: string | null;
  appointment_date: string; // YYYY-MM-DD
  appointment_time: string; // HH:MM:SS
  status: AppointmentStatus;
  booking_number: string;
}

const PREFIX = "/api/v1/member";

export const memberAppointmentApi = {
  /**
   * 查詢會員所有預約（跨院所，可選狀態篩選）。
   * @param days 回溯天數（後端上限 365，預設 90）；查單筆詳情時帶大值避免超窗找不到。
   */
  list: (
    status?: AppointmentStatus,
    days?: number,
  ): Promise<MemberAppointment[]> =>
    api.get<MemberAppointment[]>(`${PREFIX}/appointments`, {
      params: {
        ...(status ? { status } : {}),
        ...(days ? { days: String(days) } : {}),
      },
    }),

  /** 會員自助取消預約（僅 confirmed 可取消）；成功回 204 */
  cancel: (appointmentId: string): Promise<void> =>
    api.post<void>(`${PREFIX}/appointments/${appointmentId}/cancel`),
};
