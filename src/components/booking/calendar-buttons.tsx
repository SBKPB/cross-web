"use client";

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

export function CalendarButtons({
  booking,
  primaryColor = "#3b82f6",
}: CalendarButtonsProps) {
  const startDate = new Date(booking.appointment_datetime);
  const endDate = new Date(
    startDate.getTime() + booking.service.duration_minutes * 60 * 1000,
  );

  const title = `${booking.service.name} - ${booking.clinic.name}`;
  const description = `預約編號：${booking.booking_number}\n服務項目：${booking.service.name}${booking.doctor ? `\n醫師：${booking.doctor.name}` : ""}`;
  const location = booking.clinic.address;

  const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${formatDateForCalendar(startDate)}/${formatDateForCalendar(endDate)}&details=${encodeURIComponent(description)}&location=${encodeURIComponent(location || "")}`;

  const appleCalendarData = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART:${formatDateForCalendar(startDate)}
DTEND:${formatDateForCalendar(endDate)}
SUMMARY:${title}
DESCRIPTION:${description.replace(/\n/g, "\\n")}
LOCATION:${location || ""}
END:VEVENT
END:VCALENDAR`;

  const handleAppleCalendar = () => {
    const blob = new Blob([appleCalendarData], {
      type: "text/calendar;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `appointment-${booking.booking_number}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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

        <Button
          variant="outline"
          size="lg"
          className="flex-1"
          onClick={handleAppleCalendar}
        >
          <Calendar className="size-5" style={{ color: primaryColor }} />
          Apple 日曆
        </Button>
      </div>
    </div>
  );
}
