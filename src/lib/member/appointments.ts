import type { MemberAppointment, MemberQueueStatus } from "../api/member-appointment.ts";
import { QUEUE_ACTIVE_STATUSES, isTaipeiToday } from "../constants/appointment.ts";
import type { AppointmentStatus } from "../types/clinic.ts";

// 會員頁與預約詳情的純邏輯，移植自舊版 app/member/page.tsx 與 app/member/appointments/[id]/page.tsx。
// 相對路徑 import：node --test 可直接載入本檔。

export type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

/** 預約狀態徽章樣式（會員頁卡片與詳情頁 hero 共用） */
export const STATUS_VARIANT: Record<AppointmentStatus, BadgeVariant> = {
  confirmed: "default",
  checked_in: "default",
  in_progress: "default",
  completed: "secondary",
  cancelled: "destructive",
  no_show: "outline",
};

/** 詳情頁狀態 hero 的漸層底色 */
export const STATUS_HERO: Record<AppointmentStatus, string> = {
  confirmed: "from-primary to-blue-700",
  checked_in: "from-teal-500 to-cyan-700",
  in_progress: "from-indigo-500 to-blue-700",
  completed: "from-emerald-500 to-teal-600",
  cancelled: "from-slate-500 to-slate-700",
  no_show: "from-amber-500 to-orange-600",
};

const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];

// YYYY-MM-DD 以本地時區的午夜解析（與舊版相同）
const localDate = (d: string) => new Date(d + "T00:00:00");

export function formatMonthDay(d: string): string {
  const dt = localDate(d);
  return `${dt.getMonth() + 1}/${dt.getDate()}`;
}

export function formatWeekday(d: string): string {
  return `週${WEEKDAYS[localDate(d).getDay()]}`;
}

export function formatTime(t: string): string {
  return t.substring(0, 5);
}

export function formatFullDate(d: string): string {
  const dt = localDate(d);
  return `${dt.getFullYear()} 年 ${dt.getMonth() + 1} 月 ${dt.getDate()} 日（週${WEEKDAYS[dt.getDay()]}）`;
}

export function formatMemberSince(iso: string): string {
  const dt = new Date(iso);
  return `${dt.getFullYear()}/${String(dt.getMonth() + 1).padStart(2, "0")}`;
}

export function getInitials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "U";
  // 中文取末一字（姓名習慣），英文/email 取首字母
  if (/[一-龥]/.test(trimmed)) return trimmed.slice(-1);
  return trimmed.slice(0, 1).toUpperCase();
}

/** 會員頁標題名稱：顯示名稱 → email 帳號 → 「會員」 */
export function memberDisplayName(user: { display_name?: string | null; email?: string | null } | null): string {
  return user?.display_name || user?.email?.split("@")[0] || "會員";
}

/** 會員頁四個分頁的預約清單 */
export function groupMemberAppointments(appointments: MemberAppointment[]): {
  all: MemberAppointment[];
  confirmed: MemberAppointment[];
  completed: MemberAppointment[];
  cancelled: MemberAppointment[];
} {
  const byDateDesc = (a: MemberAppointment, b: MemberAppointment) =>
    b.appointment_date.localeCompare(a.appointment_date);
  const byDateAsc = (a: MemberAppointment, b: MemberAppointment) =>
    a.appointment_date.localeCompare(b.appointment_date);
  return {
    all: [...appointments].sort(byDateDesc),
    // 已預約（即將看診，含已報到 / 看診中）依日期由近到遠，方便最快就診的排最前
    confirmed: appointments.filter((a) => QUEUE_ACTIVE_STATUSES.includes(a.status)).sort(byDateAsc),
    completed: appointments.filter((a) => a.status === "completed").sort(byDateDesc),
    // 已取消含未到診（皆屬「未完成就診」的歷史）
    cancelled: appointments.filter((a) => a.status === "cancelled" || a.status === "no_show").sort(byDateDesc),
  };
}

/**
 * 叫號進度的兩個旗標：
 * - shouldPollQueue：預約是今日且仍在進行中。刻意不以進度已成功取得為前置條件 ——
 *   首次請求失敗（如弱網）時下一輪輪詢會自動重試；確認院所未開通（enabled=false）才停止。
 * - showQueueCard：院所有開通 + 預約是今日 + 進度回應的狀態仍在進行中
 */
export function queueFlags(
  appt: MemberAppointment | null,
  queueStatus: Pick<MemberQueueStatus, "enabled" | "status"> | null,
  isToday: (date: string) => boolean = isTaipeiToday,
): { shouldPollQueue: boolean; showQueueCard: boolean } {
  return {
    shouldPollQueue:
      !!appt &&
      isToday(appt.appointment_date) &&
      QUEUE_ACTIVE_STATUSES.includes(appt.status) &&
      queueStatus?.enabled !== false,
    showQueueCard:
      !!queueStatus?.enabled &&
      !!appt &&
      isToday(appt.appointment_date) &&
      QUEUE_ACTIVE_STATUSES.includes(queueStatus.status),
  };
}

/** 進度回應的狀態（已報到 / 看診中…）較新時回寫到預約本體，hero 即時更新；相同則保留原物件 */
export function applyQueueStatus(
  prev: MemberAppointment | null,
  qs: Pick<MemberQueueStatus, "status">,
): MemberAppointment | null {
  return prev && prev.status !== qs.status ? { ...prev, status: qs.status } : prev;
}
