import type { AppointmentStatus } from "@/types/clinic";

// 預約狀態 → 中文標籤（單一真實源；對齊後端 _STATUS_LABELS，避免各頁各自手抄而漂移）
export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  confirmed: "已預約",
  checked_in: "已報到",
  in_progress: "看診中",
  completed: "已完成",
  cancelled: "已取消",
  no_show: "未到診",
};

// 「尚未結束、仍在進行中」的預約狀態：即將到來分頁、置頂醒目卡、叫號進度卡共用。
export const QUEUE_ACTIVE_STATUSES: AppointmentStatus[] = [
  "confirmed",
  "checked_in",
  "in_progress",
];

// 台北今日（YYYY-MM-DD）。契約規定叫號/預約日期一律以 Asia/Taipei 為準，
// 海外時區開後台或看進度也不會誤判日期。
export function taipeiToday(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Taipei" }).format(
    new Date(),
  );
}

// 某 YYYY-MM-DD 是否為台北今日。
export function isTaipeiToday(dateStr: string): boolean {
  return dateStr === taipeiToday();
}
