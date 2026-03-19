"use client";

import { CheckCircle, Calendar, Clock, MapPin, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { BookingResponse } from "@/types/booking";

interface SuccessCardProps {
  booking: BookingResponse;
  primaryColor?: string;
}

export function SuccessCard({ booking, primaryColor = "#3b82f6" }: SuccessCardProps) {
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
      <div className="flex flex-col items-center py-6">
        <div
          className="flex size-20 items-center justify-center rounded-full"
          style={{ backgroundColor: `${primaryColor}15` }}
        >
          <CheckCircle className="size-12" style={{ color: primaryColor }} />
        </div>
        <h1 className="mt-4 text-xl font-bold text-slate-900">預約成功</h1>
        <p className="mt-1 text-sm text-slate-500">
          預約編號：{booking.booking_number}
        </p>
      </div>

      {/* Booking Details */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {/* Clinic */}
          <div className="border-b p-4">
            <h2 className="font-semibold text-slate-900">{booking.clinic.name}</h2>
            {booking.clinic.address && (
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(booking.clinic.address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 flex items-start gap-1.5 text-sm text-slate-500 hover:text-slate-700"
              >
                <MapPin className="mt-0.5 size-3.5 shrink-0" />
                <span>{booking.clinic.address}</span>
              </a>
            )}
          </div>

          {/* Appointment Info */}
          <div className="space-y-3 p-4">
            <div className="flex items-center gap-3">
              <Calendar className="size-5 text-slate-400" />
              <div>
                <p className="font-medium text-slate-900">{formattedDate}</p>
                <p className="text-sm text-slate-500">{formattedTime}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Clock className="size-5 text-slate-400" />
              <div>
                <p className="font-medium text-slate-900">{booking.service.name}</p>
                <p className="text-sm text-slate-500">
                  約 {booking.service.duration_minutes} 分鐘
                </p>
              </div>
            </div>

            {booking.doctor && (
              <div className="flex items-center gap-3">
                <User className="size-5 text-slate-400" />
                <div>
                  <p className="font-medium text-slate-900">
                    {booking.doctor.name} {booking.doctor.title}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Patient Info */}
          <div className="border-t bg-slate-50 p-4">
            <p className="text-sm text-slate-600">
              預約人：<span className="font-medium">{booking.patient_name}</span>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
