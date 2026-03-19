"use client";

import { MapPin, Phone, Clock, Navigation } from "lucide-react";
import type { Clinic } from "@/types/clinic";
import { cn } from "@/lib/utils";

interface ClinicContactInfoProps {
  clinic: Clinic;
  className?: string;
}

export function ClinicContactInfo({ clinic, className }: ClinicContactInfoProps) {
  // 取得今天的營業時間
  const getTodayHours = () => {
    if (!clinic.business_hours || clinic.business_hours.length === 0) return null;
    const today = new Date().getDay();
    const dayNames = ["週日", "週一", "週二", "週三", "週四", "週五", "週六"];
    const todayName = dayNames[today];
    return clinic.business_hours.find((h) => h.day === todayName);
  };

  const todayHours = getTodayHours();

  return (
    <div className={cn("px-4 sm:px-6", className)}>
      {/* Quick action row */}
      <div className="flex items-stretch justify-center gap-3 sm:gap-4">
        {/* 導航 */}
        {clinic.address && (
          <a
            href={`https://maps.google.com/?q=${encodeURIComponent(clinic.address)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-1 flex-col items-center gap-1.5 rounded-xl border border-n-border bg-n-card px-3 py-3 transition-all hover:border-n-border-focus hover:shadow-sm"
          >
            <div className="flex size-10 items-center justify-center rounded-full bg-n-brand-soft">
              <Navigation className="size-4.5 text-n-brand" />
            </div>
            <span className="text-xs font-medium text-n-body">導航</span>
          </a>
        )}

        {/* 撥打電話 */}
        {clinic.phone && (
          <a
            href={`tel:${clinic.phone}`}
            className="flex flex-1 flex-col items-center gap-1.5 rounded-xl border border-n-border bg-n-card px-3 py-3 transition-all hover:border-n-border-focus hover:shadow-sm"
          >
            <div className="flex size-10 items-center justify-center rounded-full bg-n-accent-soft">
              <Phone className="size-4.5 text-n-accent" />
            </div>
            <span className="text-xs font-medium text-n-body">電話</span>
          </a>
        )}

        {/* 今日營業時間 */}
        {todayHours && (
          <div className="flex flex-1 flex-col items-center gap-1.5 rounded-xl border border-n-border bg-n-card px-3 py-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-amber-50">
              <Clock className="size-4.5 text-amber-600" />
            </div>
            <span className="text-xs font-medium text-n-body">
              {todayHours.is_closed
                ? "今日休息"
                : `${todayHours.open}-${todayHours.close}`}
            </span>
          </div>
        )}
      </div>

      {/* 地址列 */}
      {clinic.address && (
        <a
          href={`https://maps.google.com/?q=${encodeURIComponent(clinic.address)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 flex items-center gap-2.5 rounded-xl border border-n-border bg-n-card px-3.5 py-3 transition-all hover:border-n-border-focus hover:shadow-sm"
        >
          <MapPin className="size-4 shrink-0 text-n-muted" />
          <span className="truncate text-sm text-n-body">{clinic.address}</span>
        </a>
      )}

      {/* 電話號碼列 */}
      {clinic.phone && (
        <a
          href={`tel:${clinic.phone}`}
          className="mt-2 flex items-center gap-2.5 rounded-xl border border-n-border bg-n-card px-3.5 py-3 transition-all hover:border-n-border-focus hover:shadow-sm"
        >
          <Phone className="size-4 shrink-0 text-n-muted" />
          <span className="text-sm text-n-body">{clinic.phone}</span>
        </a>
      )}
    </div>
  );
}
