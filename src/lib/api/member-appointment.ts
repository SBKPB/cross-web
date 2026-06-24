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
  queue_number: number | null; // 看診號（預約成立即取號）
  check_in_time: string | null; // 報到時間（ISO8601；未報到為 null）
}

// 民眾端叫號進度（GET /member/appointments/{id}/queue-status）
// enabled=false（院所方案不足）時其餘進度欄位可為 null，客戶端應隱藏進度卡
export interface MemberQueueStatus {
  enabled: boolean;
  queue_number: number | null;
  status: AppointmentStatus;
  current_number: number | null; // 目前叫號
  ahead_count: number | null; // 還差 N 位（同隊列號碼比我小且已報到的人數）
  estimated_wait_minutes: number | null; // 預估等候分鐘（僅進階叫號 PRO 院所有值）
  facility_name: string;
  staff_name: string | null;
  appointment_date: string; // YYYY-MM-DD
  appointment_time: string; // HH:MM
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

  /** 查詢單筆預約的叫號進度（院所方案不足時 enabled=false，不會 403） */
  getQueueStatus: (appointmentId: string): Promise<MemberQueueStatus> =>
    api.get<MemberQueueStatus>(
      `${PREFIX}/appointments/${appointmentId}/queue-status`,
    ),
};
