"use client";

import { Calendar, CheckCircle, Clock, MapPin, User } from "lucide-react";

import type { BookingResponse } from "@/types/booking";

interface SuccessCardProps {
  booking: BookingResponse;
  primaryColor?: string;
}

export function SuccessCard({
  booking,
  primaryColor = "#3b82f6",
}: SuccessCardProps) {
  const appointmentDate = new Date(booking.appointment_datetime);
  const formattedDate = appointmentDate.toLocaleDateString("zh-TW", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });
  const formattedTime = appointmentDate.toLocaleTimeString("zh-TW", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  return (
    <div className="px-4">
      {/* Success Icon */}
      <div className="flex flex-col items-center py-8">
        <div
          className="flex size-20 items-center justify-center rounded-full"
          style={{
            backgroundColor: `${primaryColor}1a`,
            boxShadow: `0 0 0 8px ${primaryColor}0d`,
          }}
        >
          <CheckCircle className="size-12" style={{ color: primaryColor }} />
        </div>
        <h1 className="mt-5 text-2xl font-semibold text-foreground">
          預約成功
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          預約編號:
          <span className="ml-1 font-mono font-medium text-foreground">
            {booking.booking_number}
          </span>
        </p>
      </div>

      {/* Booking Details */}
      <div className="overflow-hidden rounded-4xl bg-card shadow-md ring-1 ring-foreground/5">
        {/* Clinic */}
        <div className="border-b border-border/60 p-5">
          <h2 className="font-semibold text-foreground">
            {booking.clinic.name}
          </h2>
          {booking.clinic.address && (
            <a
              href={`https://maps.google.com/?q=${encodeURIComponent(booking.clinic.address)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1.5 flex items-start gap-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              <MapPin className="mt-0.5 size-3.5 shrink-0" />
              <span>{booking.clinic.address}</span>
            </a>
          )}
        </div>

        {/* Appointment Info */}
        <div className="space-y-4 p-5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-muted">
              <Calendar className="size-5 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium text-foreground">{formattedDate}</p>
              <p className="text-sm text-muted-foreground">{formattedTime}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-muted">
              <Clock className="size-5 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium text-foreground">
                {booking.service.name}
              </p>
              <p className="text-sm text-muted-foreground">
                約 {booking.service.duration_minutes} 分鐘
              </p>
            </div>
          </div>

          {booking.doctor && (
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-muted">
                <User className="size-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-foreground">
                  {booking.doctor.name} {booking.doctor.title}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Patient Info */}
        <div className="border-t border-border/60 bg-muted/50 p-5">
          <p className="text-sm text-muted-foreground">
            預約人：
            <span className="font-medium text-foreground">
              {booking.patient_name}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
