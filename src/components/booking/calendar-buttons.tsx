"use client";

import { useSyncExternalStore } from "react";
import { Calendar } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { BookingResponse } from "@/types/booking";

interface CalendarButtonsProps {
  booking: BookingResponse;
  primaryColor?: string;
}

function formatDateForCalendar(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

// ICS 文字欄位需 escape 特定字元（RFC 5545 §3.3.11）
function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function isAppleDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  // iPhone / iPad / iPod；iPadOS 13+ 會偽裝成 Mac，靠 maxTouchPoints 判斷
  if (/iPad|iPhone|iPod/.test(ua)) return true;
  if (/Macintosh/.test(ua)) return true;
  if (
    typeof navigator.maxTouchPoints === "number" &&
    navigator.maxTouchPoints > 1 &&
    /Mac/.test(ua)
  ) {
    return true;
  }
  return false;
}

// 用 useSyncExternalStore 在 client 才回傳 isAppleDevice()，避免 hydration mismatch
const subscribeNoop = () => () => {};

export function CalendarButtons({
  booking,
  primaryColor = "#3b82f6",
}: CalendarButtonsProps) {
  // Apple 日曆按鈕只在 Apple 裝置顯示
  const showApple = useSyncExternalStore(
    subscribeNoop,
    () => isAppleDevice(),
    () => false,
  );

  const startDate = new Date(booking.appointment_datetime);
  const endDate = new Date(
    startDate.getTime() + booking.service.duration_minutes * 60 * 1000,
  );

  const title = `${booking.service.name} - ${booking.clinic.name}`;
  const description = `預約編號：${booking.booking_number}\n服務項目：${booking.service.name}${booking.doctor ? `\n醫師：${booking.doctor.name}` : ""}`;
  const location = booking.clinic.address;

  const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${formatDateForCalendar(startDate)}/${formatDateForCalendar(endDate)}&details=${encodeURIComponent(description)}&location=${encodeURIComponent(location || "")}`;

  // RFC 5545：CRLF 換行、必填 UID/DTSTAMP/PRODID，文字欄位需 escape
  const appleCalendarData = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Cross//Twinhao//ZH-TW",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:appointment-${booking.booking_number}@cross.twinhao.com`,
    `DTSTAMP:${formatDateForCalendar(new Date())}`,
    `DTSTART:${formatDateForCalendar(startDate)}`,
    `DTEND:${formatDateForCalendar(endDate)}`,
    `SUMMARY:${escapeIcsText(title)}`,
    `DESCRIPTION:${escapeIcsText(description)}`,
    `LOCATION:${escapeIcsText(location || "")}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  const handleAppleCalendar = () => {
    // Apple 裝置：用 data: URL 直接導航，Safari 會跳「加入行事曆」prompt
    // 不用 a.download，避免被當成檔案存到 Files。
    const dataUrl = `data:text/calendar;charset=utf-8,${encodeURIComponent(appleCalendarData)}`;
    window.location.href = dataUrl;
  };

  return (
    <div className="space-y-3 px-4">
      <p className="text-center text-sm text-muted-foreground">加入行事曆</p>

      <div className="flex gap-3">
        <Button variant="outline" size="lg" className="flex-1" asChild>
          <a
            href={googleCalendarUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Calendar className="size-5" style={{ color: primaryColor }} />
            Google 日曆
          </a>
        </Button>

        {showApple && (
          <Button
            variant="outline"
            size="lg"
            className="flex-1"
            onClick={handleAppleCalendar}
          >
            <Calendar className="size-5" style={{ color: primaryColor }} />
            Apple 日曆
          </Button>
        )}
      </div>
    </div>
  );
}
