import type { BookingResponse } from "../types/booking.ts";

// 預約成功頁的日期格式與「加入行事曆」的連結、ICS 內容，移植自舊版 components/booking/success-card.tsx、
// calendar-buttons.tsx（輸出逐字相同）。
// 相對路徑 import：node --test 可直接載入本檔。

export function formatDateForCalendar(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

// ICS 文字欄位需 escape 特定字元（RFC 5545 §3.3.11）
export function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

/** Apple 日曆按鈕只在 Apple 裝置顯示；nav 預設為瀏覽器的 navigator（伺服器端沒有則為否） */
export function isAppleDevice(
  nav: { userAgent: string; maxTouchPoints?: number } | undefined = typeof navigator === "undefined"
    ? undefined
    : navigator,
): boolean {
  if (!nav) return false;
  const ua = nav.userAgent;
  // iPhone / iPad / iPod；iPadOS 13+ 會偽裝成 Mac，靠 maxTouchPoints 判斷
  if (/iPad|iPhone|iPod/.test(ua)) return true;
  if (/Macintosh/.test(ua)) return true;
  if (typeof nav.maxTouchPoints === "number" && nav.maxTouchPoints > 1 && /Mac/.test(ua)) {
    return true;
  }
  return false;
}

/** 預約成功卡上的日期與時間（移植自舊版 success-card.tsx） */
export function formatAppointmentDateTime(appointmentDatetime: string): { date: string; time: string } {
  const appointmentDate = new Date(appointmentDatetime);
  return {
    date: appointmentDate.toLocaleDateString("zh-TW", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
    }),
    time: appointmentDate.toLocaleTimeString("zh-TW", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }),
  };
}

function calendarEvent(booking: BookingResponse) {
  const startDate = new Date(booking.appointment_datetime);
  const endDate = new Date(startDate.getTime() + booking.service.duration_minutes * 60 * 1000);
  const title = `${booking.service.name} - ${booking.clinic.name}`;
  const description = `預約編號：${booking.booking_number}\n服務項目：${booking.service.name}${booking.doctor ? `\n醫師：${booking.doctor.name}` : ""}`;
  const location = booking.clinic.address;
  return { startDate, endDate, title, description, location };
}

export function googleCalendarUrl(booking: BookingResponse): string {
  const { startDate, endDate, title, description, location } = calendarEvent(booking);
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${formatDateForCalendar(startDate)}/${formatDateForCalendar(endDate)}&details=${encodeURIComponent(description)}&location=${encodeURIComponent(location || "")}`;
}

// RFC 5545：CRLF 換行、必填 UID/DTSTAMP/PRODID，文字欄位需 escape
export function appleCalendarData(booking: BookingResponse, now: Date = new Date()): string {
  const { startDate, endDate, title, description, location } = calendarEvent(booking);
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Cross//Twinhao//ZH-TW",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:appointment-${booking.booking_number}@cross.twinhao.com`,
    `DTSTAMP:${formatDateForCalendar(now)}`,
    `DTSTART:${formatDateForCalendar(startDate)}`,
    `DTEND:${formatDateForCalendar(endDate)}`,
    `SUMMARY:${escapeIcsText(title)}`,
    `DESCRIPTION:${escapeIcsText(description)}`,
    `LOCATION:${escapeIcsText(location || "")}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}
